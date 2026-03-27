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
    create_issue, get_db_connection
)
from db import crud
from api.auth import verify_token, get_user_id
from api.sse import get_queue, emit
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
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

router = APIRouter()

RUN_ID_PATTERN = re.compile(r"^[a-f0-9\-]{1,36}$")

# ---------------- BACKGROUND AGENT ---------------- #

def background_agent_run(run_id: str, repo_url: str, team_name: str, leader_name: str, branch_name: str, project_id: str = None):
    print(f"🔥 BACKGROUND TASK STARTED for run_id={run_id}")
    
    db = SessionLocal()
    try:
        repo_path = os.path.join(os.getcwd(), "workspaces", f"run_{run_id}")
        emit(run_id, "GitAgent", f"Cloning repository {repo_url}...", "RUN_STARTED")
        clone_repo(repo_url, repo_path)
        
        orch = OrchestratorAgent(db=db)
        result = orch.run(
            run_id=run_id,
            repo_url=repo_url,
            repo_path=repo_path,
            team_name=team_name,
            leader_name=leader_name
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
        repos = await get_user_repositories()
        return {"repos": repos}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch GitHub repos: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

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
        logger.exception("Failed to create project: %s", e)
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
        # Mocking graph for UI
        nodes = [
            {"id": "src/App.jsx", "type": "file", "risk_score": 0.2},
            {"id": "src/api/auth.js", "type": "file", "risk_score": 0.8},
            {"id": "src/api/db.js", "type": "file", "risk_score": 0.9},
        ]
        edges = [
            {"source": "src/api/auth.js", "target": "src/App.jsx"},
            {"source": "src/api/db.js", "target": "src/App.jsx"},
        ]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

    # Create a DB run whenever we have a project_id (even if auth is missing),
    # otherwise background iteration logging will violate FK constraints.
    if request_body.project_id:
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
        request_body.project_id
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
        analysis = generate_rca(req.error_log)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workspace/infra")
async def get_infra(req: InfraRequest, request: Request):
    try:
        await verify_token(request)
        project = get_project(req.project_id)
        if not project:
            raise Exception("Project not found")
        
        from agents.workspace_agent import generate_infra
        context = f"Project: {project['name']}, Repo: {project['repo_url']}"
        infra = generate_infra(context)
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
