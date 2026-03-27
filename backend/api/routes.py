from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel
from api.auth import verify_token, get_user_id
from api.sse import get_queue, emit
from agents.orchestrator import OrchestratorAgent
from tools.git_ops import clone_repo
import uuid
import json
import os
import threading

router = APIRouter()

class RunRequest(BaseModel):
    repo_url: str
    team_name: str = ""
    leader_name: str = ""

# In-memory run tracker (for status)
runs = {}

def real_agent_pipeline(run_id: str, repo_url: str, team_name: str, leader_name: str, user_id: str = None):
    """Run the real LangGraph orchestrator."""
    try:
        # 1. Clone repo
        repo_path = os.path.join("/tmp/hogriders", run_id)
        emit(run_id, "GitAgent", f"Cloning repository {repo_url}...", "RUN_STARTED")
        clone_repo(repo_url, repo_path)
        
        # 2. Run Orchestrator
        orchestrator = OrchestratorAgent()
        result = orchestrator.run(
            run_id=run_id,
            repo_url=repo_url,
            repo_path=repo_path,
            team_name=team_name,
            leader_name=leader_name
        )
        
        runs[run_id] = {"status": result.get("status", "COMPLETED"), "data": result}
        
        # 3. Save result in DB if user_id
        if user_id:
            try:
                from api.db import update_run_result
                update_run_result(run_id, result)
            except Exception as e:
                print(f"DB update error: {e}")

    except Exception as e:
        emit(run_id, "OrchestratorAgent", f"Pipeline failed: {str(e)}", "RUN_FAILED")
        runs[run_id] = {"status": "FAILED", "error": str(e)}

@router.post("/run")
async def run_agent(request_body: RunRequest, request: Request, bg_tasks: BackgroundTasks):
    user_id = None
    try:
        await verify_token(request)
        user_id = get_user_id(request)
    except Exception:
        pass

    run_id = str(uuid.uuid4())[:8]
    get_queue(run_id) 
    runs[run_id] = {"status": "STARTED"}

    # Initial DB record
    if user_id:
        try:
            from api.db import ensure_user, create_run
            email = getattr(request.state, "email", "anonymous")
            ensure_user(user_id, email)
            create_run(run_id, user_id, request_body.repo_url)
        except Exception:
            pass

    # Start in background thread to avoid blocking FastAPI
    thread = threading.Thread(
        target=real_agent_pipeline, 
        args=(run_id, request_body.repo_url, request_body.team_name, request_body.leader_name, user_id),
        daemon=True
    )
    thread.start()

    return {
        "run_id": run_id,
        "status": "STARTED"
    }

@router.get("/results/{run_id}")
async def get_results(run_id: str):
    # Check filesystem first (ReporterAgent saves it there)
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            return json.load(f)
    
    # Fallback to in-memory
    if run_id in runs and "data" in runs[run_id]:
        return runs[run_id]["data"]
        
    return {"error": "Results not found"}

@router.get("/status/{run_id}")
async def get_status(run_id: str):
    if run_id in runs:
        return {"run_id": run_id, "status": runs[run_id]["status"]}
    return {"error": "Run not found"}

@router.get("/history")
async def get_history(request: Request):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        from api.db import get_user_runs
        return {"runs": get_user_runs(user_id)}
    except Exception as e:
        return {"error": str(e)}
