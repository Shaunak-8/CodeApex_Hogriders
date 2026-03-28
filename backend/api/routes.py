import uuid
import os
import re
import json
import logging
import threading
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session

from db.db import get_db, SessionLocal
from api.db import (
    ensure_user, create_project, get_projects, 
    get_project_stats, create_run as db_create_run, update_run_result,
    get_project, create_task, get_tasks, update_task_status,
    create_issue, get_db_connection, get_heatmap_stats, get_latest_run
)
from db import crud
from api.auth import verify_token, get_user_id
from api.sse import get_queue, emit
from agents.orchestrator import OrchestratorAgent
import tools.git_ops as git_ops
import logging
from api.models import (
    ProjectCreate, EnsureUserRequest, RunRequest, 
    TaskCreate, TaskUpdate, WorkspaceChatRequest,
    RCARequest, InfraRequest
)

logger = logging.getLogger(__name__)

router = APIRouter()

from agents.orchestrator import OrchestratorAgent
from tools.git_ops import clone_repo
from tools.github_api import get_user_repositories
from core.project_analyzer import ProjectAnalyzer
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

router = APIRouter()

RUN_ID_PATTERN = re.compile(r"^[a-f0-9\-]{1,36}$")

# ---------------- BACKGROUND AGENT ---------------- #

def background_agent_run(run_id: str, repo_url: str, team_name: str, leader_name: str, branch_name: str, project_id: str = None, token: str = None):
    token_status = "present" if token else "missing"
    print(f"🔥 BACKGROUND TASK STARTED for run_id={run_id} | Token: {token_status}")
    
    db = SessionLocal()
    try:
        repo_path = os.path.join(os.getcwd(), "workspaces", f"run_{run_id}")
        emit(run_id, "GitAgent", f"Cloning repository {repo_url}...", "RUN_STARTED")
        git_ops.clone_repo(repo_url, repo_path, token=token)
        
        orch = OrchestratorAgent(db=db)
        result = orch.run(
            run_id=run_id,
            repo_url=repo_url,
            repo_path=repo_path,
            team_name=team_name,
            leader_name=leader_name,
            token=token
        )
        
        if project_id:
            try:
                update_run_result(run_id, result.get("status", "COMPLETED"), result)
            except Exception as e:
                print(f"DB update error: {e}")
                
    except Exception as e:
        logger.exception("Agent run %s failed: %s", run_id, e)
        emit(run_id, "OrchestratorAgent", f"Critical Error: {str(e)}", "RUN_FAILED")
        db.rollback()
    finally:
        db.close()

# ---------------- USER ENDPOINTS ---------------- #

@router.post("/me")
async def register_user(req: EnsureUserRequest, request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        ensure_user(user_id, req.email, req.profile_data)
        return {"status": "success", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to register user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- GITHUB INTEGRATION ---------------- #

@router.get("/repos")
async def fetch_github_repos(request: Request):
    try:
        await verify_token(request)
        logger.info("Token verified, fetching repos...")
        repos = await get_user_repositories()
        logger.info(f"Successfully fetched {len(repos)} repos from GitHub API")
        return {"repos": repos}
    except HTTPException:
        # Propagation for existing HTTPExceptions (like from verify_token)
        raise
    except ValueError as e:
        # Typically missing GITHUB_TOKEN
        logger.error(f"Configuration error fetching repos: {e}")
        raise HTTPException(status_code=401, detail=str(e))
    except RuntimeError as e:
        # GitHub API errors (mapped from 401/403 if present in message)
        err_msg = str(e)
        status = 502 # Bad Gateway as default for upstream failure
        if "401" in err_msg:
            status = 401
        elif "403" in err_msg:
            status = 403
        
        logger.error(f"GitHub API error in route: {err_msg}")
        raise HTTPException(status_code=status, detail=err_msg)
    except Exception as e:
        logger.error(f"Unexpected error fetching GitHub repos: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching repositories.")

# ---------------- PROJECT ENDPOINTS ---------------- #

@router.post("/projects")
async def create_new_project(req: ProjectCreate, request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        project = create_project(user_id, req.repo_url, req.name, req.tags, req.visibility)
        return {"project": project}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Project creation failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects")
async def list_projects(request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        projects = get_projects(user_id)
        
        for p in projects:
            p['stats'] = get_project_stats(p['id'])
            
        return {"projects": projects}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list projects: %s", e)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects/{project_id}/graph")
async def get_project_graph(project_id: str, request: Request):
    try:
        await verify_token(request)
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Try to find an existing workspace
        latest_run = get_latest_run(project_id)
        repo_path = None
        
        if latest_run:
            candidate_path = os.path.join(os.getcwd(), "workspaces", f"run_{latest_run['id']}")
            if os.path.exists(candidate_path):
                repo_path = candidate_path

        if not repo_path:
            # Fallback: Clone temporarily if no workspace is active
            temp_id = str(uuid.uuid4())[:8]
            repo_path = os.path.join(os.getcwd(), "workspaces", f"temp_graph_{temp_id}")
            clone_repo(project['repo_url'], repo_path)
            # We don't cleanup immediately so browser can refresh, 
            # but ideally should have a cleanup task.

        analyzer = ProjectAnalyzer(repo_path)
        graph = analyzer.analyze()
        return graph
    except Exception as e:
        logger.error(f"Graph analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- RUN ENDPOINT ---------------- #

@router.post("/run")
@router.post("/run-agent")
async def run_agent(
    request_body: RunRequest,
    request: Request,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user_id = None
    try:
        await verify_token(request)
        user_id = get_user_id(request)
    except Exception:
        pass

    # Always pick a run_id first so we can use it consistently for SSE + DB.
    run_id = str(uuid.uuid4())[:8]

    # Create a DB run immediately so background tasks can link iterations/fixes to it.
    db_create_run(
        run_id=run_id,
        project_id=request_body.project_id,
        repo_url=request_body.repo_url,
        team_name=request_body.team_name,
        leader_name=request_body.leader_name,
        branch_name=request_body.branch_name,
    )

    # Initialize SSE Queue
    get_queue(run_id)

    # Trigger background intelligence
    bg_tasks.add_task(
        background_agent_run,
        run_id,
        request_body.repo_url,
        request_body.team_name,
        request_body.leader_name,
        request_body.branch_name,
        request_body.project_id,
        request.headers.get("X-GitHub-Token")
    )

    return {"run_id": run_id, "status": "STARTED"}

# ---------------- STATUS & RESULTS ---------------- #

@router.get("/runs")
def get_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_runs(db, skip=skip, limit=limit)

@router.get("/runs/{run_id}")
@router.get("/status/{run_id}")
def get_status(run_id: str, db: Session = Depends(get_db)):
    db_run = crud.get_run(db, run_id=run_id)
    if db_run:
        return {
            "run_id": run_id,
            "status": db_run.status,
            "score": db_run.overall_score,
            "team_name": db_run.team_name,
            "repo_url": db_run.repo_url,
            "created_at": str(db_run.created_at) if db_run.created_at else None,
        }

    # Fallback to file system
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            data = json.load(f)
            return {"run_id": run_id, "status": "completed", "score": data.get("score", 0)}

    return {"run_id": run_id, "status": "running"}

@router.get("/results/{run_id}")
async def get_results(run_id: str):
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            return json.load(f)
    return {"status": "not found"}

# ---------------- WORKSPACE & TASKS ---------------- #

@router.post("/workspace/chat")
async def workspace_chat_endpoint(req: WorkspaceChatRequest, request: Request):
    try:
        await verify_token(request)
        project = get_project(req.project_id)
        if not project:
            raise Exception("Project not found")
        
        from agents.workspace_agent import analyze_workspace
        roadmap = analyze_workspace(project['repo_url'], req.prompt)
        
        created_tasks = []
        for t in roadmap.tasks:
            desc = f"{t.description} (Reason: {t.rationale})"
            task = create_task(req.project_id, desc, "todo")
            created_tasks.append(task)
            
        return {
            "summary": roadmap.summary,
            "tasks": created_tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}/tasks")
async def fetch_project_tasks(project_id: str, request: Request):
    try:
        await verify_token(request)
        tasks = get_tasks(project_id)
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/projects/{project_id}/tasks")
async def add_task(project_id: str, req: TaskCreate, request: Request):
    try:
        await verify_token(request)
        task = create_task(project_id, req.description, req.status)
        return {"task": task}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/tasks/{task_id}")
async def update_task(task_id: str, req: TaskUpdate, request: Request):
    try:
        await verify_token(request)
        update_task_status(task_id, req.status)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------------- WEBHOOKS ---------------- #

def get_project_by_repo(repo_url: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM projects WHERE repo_url = %s", (repo_url,))
            return cur.fetchone()
    finally:
        conn.close()

@router.post("/webhooks/github")
async def github_webhook(request: Request):
    event = request.headers.get("x-github-event")
    payload = await request.json()
    
    if event == "push":
        repo_url = payload.get("repository", {}).get("html_url")
        commits = payload.get("commits", [])
        
        project = get_project_by_repo(repo_url)
        if not project:
            return {"status": "ignored", "reason": "Repository not tracked"}
            
        from agents.review_agent import analyze_diff
        diff_text = "\n".join([c.get("message", "") for c in commits])
        
        try:
            review_result = analyze_diff(diff_text)
            for issue in review_result.issues:
                create_issue(project["id"], issue.file, issue.severity, "open")
                emit("global", "ReviewAgent", f"🚨 {issue.severity.upper()} issue in {issue.file}: {issue.description}", "ISSUE_DETECTED")
            return {"status": "scanned", "issues_found": len(review_result.issues)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    return {"status": "ignored"}

# ---------------- ADVANCED AI INSIGHTS ---------------- #

@router.post("/workspace/rca")
async def get_rca(req: RCARequest, request: Request):
    try:
        await verify_token(request)
        from agents.workspace_agent import generate_rca
        
        # Try to find recent code context if a run_id or project_id is available
        code_context = ""
        project = get_project(req.project_id) if hasattr(req, 'project_id') else None
        
        if project:
            latest_run = get_latest_run(project['id'])
            if latest_run:
                repo_path = os.path.join(os.getcwd(), "workspaces", f"run_{latest_run['id']}")
                if os.path.exists(repo_path):
                    # Simple heuristic: find files mentioned in error log
                    files_to_read = []
                    for root, _, files in os.walk(repo_path):
                        for f in files:
                            if f in req.error_log:
                                files_to_read.append(os.path.join(root, f))
                    
                    for f_path in files_to_read[:3]: # Limit to first 3 files
                        try:
                            with open(f_path, 'r', errors='ignore') as f:
                                code_context += f"\nFILE: {os.path.relpath(f_path, repo_path)}\n{f.read()[:2000]}\n"
                        except: pass

        analysis = generate_rca(req.error_log, code_context=code_context)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workspace/infra")
async def get_infra(req: InfraRequest, request: Request):
    try:
        await verify_token(request)
        project = get_project(req.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        from agents.workspace_agent import generate_infra
        
        # Scrape root manifest files for better context
        file_manifest = {}
        target_files = ["package.json", "requirements.txt", "CMakeLists.txt", "go.mod", "pom.xml", "build.gradle", "Dockerfile"]
        
        latest_run = get_latest_run(project['id'])
        if latest_run:
            repo_path = os.path.join(os.getcwd(), "workspaces", f"run_{latest_run['id']}")
            if os.path.exists(repo_path):
                for tf in target_files:
                    try:
                        f_path = os.path.join(repo_path, tf)
                        if os.path.exists(f_path):
                            with open(f_path, 'r', errors='ignore') as f:
                                file_manifest[tf] = f.read()[:5000]
                    except: pass

        context = f"Project: {project['name']}, Repo: {project['repo_url']}"
        infra = generate_infra(context, file_manifest=file_manifest)
        return infra
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(request: Request, db: Session = Depends(get_db)):
    try:
        await verify_token(request)
        runs = crud.get_runs(db, limit=50)
        return {"runs": runs}
    except Exception as e:
        return {"error": str(e)}

@router.get("/stats/heatmap")
async def get_heatmap(request: Request):
    try:
        await verify_token(request)
        data = get_heatmap_stats()
        return {"heatmap": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
