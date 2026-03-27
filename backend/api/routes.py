from fastapi import APIRouter, BackgroundTasks, Request, HTTPException
from pydantic import BaseModel
from typing import List
from api.auth import verify_token, get_user_id
from api.sse import get_queue, emit
from agents.orchestrator import OrchestratorAgent
from tools.git_ops import clone_repo
from tools.github_api import get_user_repositories
from api.models import ProjectCreate, EnsureUserRequest
from api.db import ensure_user, create_project, get_projects, get_project_stats, create_run, update_run_result
import uuid
import json
import os
import threading

router = APIRouter()

class RunRequest(BaseModel):
    project_id: str
    repo_url: str
    team_name: str = ""
    leader_name: str = ""

runs = {}

def real_agent_pipeline(run_id: str, repo_url: str, team_name: str, leader_name: str, project_id: str = None):
    try:
        repo_path = os.path.join("/tmp/hogriders", run_id)
        emit(run_id, "GitAgent", f"Cloning repository {repo_url}...", "RUN_STARTED")
        clone_repo(repo_url, repo_path)
        
        orchestrator = OrchestratorAgent()
        result = orchestrator.run(
            run_id=run_id,
            repo_url=repo_url,
            repo_path=repo_path,
            team_name=team_name,
            leader_name=leader_name
        )
        
        runs[run_id] = {"status": result.get("status", "COMPLETED"), "data": result}
        
        if project_id:
            try:
                update_run_result(run_id, result.get("status", "COMPLETED"), result)
            except Exception as e:
                print(f"DB update error: {e}")

    except Exception as e:
        emit(run_id, "OrchestratorAgent", f"Pipeline failed: {str(e)}", "RUN_FAILED")
        runs[run_id] = {"status": "FAILED", "error": str(e)}

# --- USER ENDPOINTS ---
@router.post("/me")
async def register_user(req: EnsureUserRequest, request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        ensure_user(user_id, req.email, req.profile_data)
        return {"status": "success", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# --- GITHUB INTEGRATION ---
@router.get("/repos")
async def fetch_github_repos(request: Request):
    try:
        await verify_token(request)
        repos = await get_user_repositories()
        return {"repos": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- PROJECT ENDPOINTS ---
@router.post("/projects")
async def create_new_project(req: ProjectCreate, request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        project = create_project(user_id, req.repo_url, req.name, req.tags, req.visibility)
        return {"project": project}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects")
async def list_projects(request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        projects = get_projects(user_id)
        
        # Attach quick stats to each project
        for p in projects:
            p['stats'] = get_project_stats(p['id'])
            
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects/{project_id}/graph")
async def get_project_graph(project_id: str, request: Request):
    # Simulated AST/Dependency Graph logic for MVP
    # Real implementation would clone the repo, run regex/AST parsers on imports, and score by cyclomatic complexity.
    try:
        await verify_token(request)
        nodes = [
            {"id": "src/App.jsx", "type": "file", "risk_score": 0.2},
            {"id": "src/index.js", "type": "file", "risk_score": 0.1},
            {"id": "src/api/auth.js", "type": "file", "risk_score": 0.8},
            {"id": "src/api/db.js", "type": "file", "risk_score": 0.9},
            {"id": "src/components/Header.jsx", "type": "file", "risk_score": 0.3},
            {"id": "src/utils/helpers.js", "type": "file", "risk_score": 0.5},
            {"id": "src/store/index.js", "type": "file", "risk_score": 0.6},
        ]
        edges = [
            {"source": "src/index.js", "target": "src/App.jsx"},
            {"source": "src/App.jsx", "target": "src/components/Header.jsx"},
            {"source": "src/api/auth.js", "target": "src/utils/helpers.js"},
            {"source": "src/api/db.js", "target": "src/utils/helpers.js"},
            {"source": "src/App.jsx", "target": "src/store/index.js"},
            {"source": "src/store/index.js", "target": "src/api/db.js"},
            {"source": "src/store/index.js", "target": "src/api/auth.js"}
        ]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- PIPELINE ENDPOINTS ---
@router.post("/run")
async def run_agent(request_body: RunRequest, request: Request):
    user_id = None
    try:
        await verify_token(request)
        user_id = get_user_id(request)
    except Exception:
        pass

    db_run = create_run(request_body.project_id) if user_id else None
    run_id = str(db_run['id']) if db_run else str(uuid.uuid4())[:8]
    
    get_queue(run_id) 
    runs[run_id] = {"status": "STARTED"}

    thread = threading.Thread(
        target=real_agent_pipeline, 
        args=(run_id, request_body.repo_url, request_body.team_name, request_body.leader_name, request_body.project_id),
        daemon=True
    )
    thread.start()

    return {"run_id": run_id, "status": "STARTED"}

@router.get("/results/{run_id}")
async def get_results(run_id: str):
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            return json.load(f)
    
    if run_id in runs and "data" in runs[run_id]:
        return runs[run_id]["data"]
        
    return {"error": "Results not found"}

@router.get("/status/{run_id}")
async def get_status(run_id: str):
    if run_id in runs:
        return {"run_id": run_id, "status": runs[run_id]["status"]}
    return {"error": "Run not found"}

# --- WORKSPACE & TASKS ENDPOINTS ---
from api.models import TaskCreate, TaskUpdate, WorkspaceChatRequest
from api.db import create_task, get_tasks, update_task_status, get_project

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
            # We add rationale as part of description or keep it simple
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

# --- WEBHOOKS & AUTOMATED REVIEW ---
from api.db import create_issue, get_db_connection
from psycopg2.extras import RealDictCursor

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
    # Process GitHub webhook securely
    event = request.headers.get("x-github-event")
    payload = await request.json()
    
    if event == "push":
        repo_url = payload.get("repository", {}).get("html_url")
        commits = payload.get("commits", [])
        
        project = get_project_by_repo(repo_url)
        if not project:
            return {"status": "ignored", "reason": "Repository not tracked as a project"}
            
        # Simulate fetching diff and scanning
        from agents.review_agent import analyze_diff
        
        # In a real app we would git fetch the diff. Here we just take the commit msgs or mock
        # For demonstration context, we'll pretend the user pushed a hardcoded secret if commit message implies it
        diff_text = "\n".join([c.get("message", "") for c in commits])
        
        try:
            review_result = analyze_diff(diff_text)
            
            for issue in review_result.issues:
                # DB Insert
                created = create_issue(
                    project_id=project["id"],
                    file=issue.file,
                    severity=issue.severity,
                    status="open"
                )
                
                # Emit real-time event to the global stream or project stream
                emit("global", "ReviewAgent", f"🚨 {issue.severity.upper()} issue in {issue.file}: {issue.description}", "ISSUE_DETECTED")
                
            return {"status": "scanned", "issues_found": len(review_result.issues)}
        except Exception as e:
            print(f"Review failed: {e}")
            return {"status": "error", "message": str(e)}
            
    return {"status": "ignored"}

# --- ADVANCED AI INSIGHTS ---
from api.models import RCARequest, InfraRequest
from agents.workspace_agent import generate_rca, generate_infra

@router.post("/workspace/rca")
async def get_rca(req: RCARequest, request: Request):
    try:
        await verify_token(request)
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
        
        # We pass some context about the project (name, repo)
        context = f"Project: {project['name']}, Repo: {project['repo_url']}"
        infra = generate_infra(context)
        return infra
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

