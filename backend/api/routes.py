from fastapi import APIRouter, BackgroundTasks, Request, Depends
from pydantic import BaseModel
import agents.orchestrator as orchestrator
from api.auth import verify_token, get_user_id

router = APIRouter()

class RunRequest(BaseModel):
    repo_url: str
    team_name: str = ""
    leader_name: str = ""

def background_agent_run(run_id: str, repo_url: str):
    orch = orchestrator.OrchestratorAgent()
    orch.run(run_id)

@router.post("/run")
async def run_agent(request_body: RunRequest, request: Request, bg_tasks: BackgroundTasks):
    # Try to verify token, but allow unauthenticated for now
    user_id = None
    try:
        await verify_token(request)
        user_id = get_user_id(request)
    except Exception:
        pass
    
    import uuid
    run_id = str(uuid.uuid4())[:8]
    
    # If we have DB and user_id, record the run
    if user_id:
        try:
            from api.db import ensure_user, create_run
            email = getattr(request.state, "email", "")
            ensure_user(user_id, email)
            create_run(run_id, user_id, request_body.repo_url)
        except Exception:
            pass  # DB not configured yet, skip
    
    bg_tasks.add_task(background_agent_run, run_id, request_body.repo_url)
    return { 
        "run_id": run_id, 
        "status": "started",
        "branch": "HOGRIDERS_EKLAVYA_PURI_AI_Fix"
    }

@router.get("/results/{run_id}")
async def get_results(run_id: str, request: Request):
    import json
    import os
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            return json.load(f)
    return {"status": "not found"}

@router.get("/status/{run_id}")
async def get_status(run_id: str):
    import json
    import os
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            data = json.load(f)
        return {"run_id": run_id, "status": "completed", "score": data.get("score", 0)}
    return {"run_id": run_id, "status": "running"}

@router.get("/history")
async def get_history(request: Request):
    """Get run history for authenticated user."""
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        from api.db import get_user_runs
        runs = get_user_runs(user_id)
        return {"runs": runs}
    except Exception as e:
        return {"runs": [], "error": str(e)}
