import uuid
import os
import re
import json
<<<<<<< HEAD
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
=======
from fastapi import APIRouter, Depends, BackgroundTasks, Request
>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.db import get_db, SessionLocal
from db import crud

<<<<<<< HEAD
import agents.orchestrator as orchestrator
try:
    from api.auth import verify_token, get_user_id
except ImportError:
    async def verify_token(req): pass
    def get_user_id(req): return None
=======
from api.auth import verify_token, get_user_id
from api.sse import get_queue, emit

from agents.orchestrator import OrchestratorAgent
from tools.git_ops import clone_repo
>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc

logger = logging.getLogger(__name__)

router = APIRouter()

<<<<<<< HEAD
# Strict pattern: 8-char hex UUID prefix
RUN_ID_PATTERN = re.compile(r"^[a-f0-9\-]{1,36}$")
=======
>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc

class RunRequest(BaseModel):
    repo_url: str
    team_name: str = ""
    leader_name: str = ""
    branch_name: str = "main"


# ---------------- BACKGROUND AGENT ---------------- #

def background_agent_run(run_id: str, repo_url: str, branch_name: str):
    print(f"🔥 BACKGROUND TASK STARTED for run_id={run_id}")

    db = SessionLocal()
    try:
<<<<<<< HEAD
        orch = orchestrator.OrchestratorAgent(db=db)
        orch.run(run_id=run_id, repo_url=repo_url, branch_name=branch_name)
    except Exception as e:
        logger.exception("Agent run %s failed: %s", run_id, e)
        db.rollback()
=======
        orch = OrchestratorAgent(db=db)

        repo_path = os.path.join("workspaces", f"run_{run_id}")
        clone_repo(repo_url, repo_path)

        orch.run(
            run_id=run_id,
            repo_url=repo_url,
            repo_path=repo_path,
            branch_name=branch_name
        )

    except Exception as e:
        print(f"❌ Agent failed: {e}")
>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
    finally:
        db.close()


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
<<<<<<< HEAD
    except Exception as e:
        logger.debug("Auth skipped (unauthenticated request): %s", e)
    
=======
    except Exception:
        pass

>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
    run_id = str(uuid.uuid4())[:8]

    # ✅ DB TRACKING (YOUR USP)
    crud.create_run(
        db,
        run_id=run_id,
        repo_url=request_body.repo_url,
        team_name=request_body.team_name,
        leader_name=request_body.leader_name,
        branch_name=request_body.branch_name
    )

    # ✅ SSE + Queue init
    get_queue(run_id)

    # ✅ BACKGROUND EXECUTION
    bg_tasks.add_task(
        background_agent_run,
        run_id,
        request_body.repo_url,
        request_body.branch_name
    )

    return {
        "run_id": run_id,
        "status": "STARTED",
        "branch": request_body.branch_name
    }


# ---------------- STATUS ---------------- #

@router.get("/runs")
def get_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_runs(db, skip=skip, limit=limit)

<<<<<<< HEAD
@router.get("/runs/{run_id}")
@router.get("/status/{run_id}") # upstream alias
def get_status(run_id: str, db: Session = Depends(get_db)):
    """Returns run summary"""
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

    # fallback to file-based results
    if not RUN_ID_PATTERN.match(run_id):
        return {"run_id": run_id, "status": "not found"}
    results_dir = os.path.abspath("results")
    candidate = os.path.abspath(os.path.join(results_dir, f"{run_id}.json"))
    if candidate.startswith(results_dir + os.sep) and os.path.exists(candidate):
        with open(candidate, "r") as f:
            data = json.load(f)
        return {"run_id": run_id, "status": "completed", "score": data.get("score", 0)}
=======

@router.get("/runs/{run_id}")
@router.get("/status/{run_id}")
def get_status(run_id: str, db: Session = Depends(get_db)):
    db_run = crud.get_run(db, run_id=run_id)

    if db_run:
        return {
            "run_id": run_id,
            "status": db_run.status,
            "score": db_run.overall_score,
            "db_record": db_run
        }

>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
    return {"run_id": run_id, "status": "running"}


# ---------------- FIXES ---------------- #

@router.get("/fixes/{run_id}")
def get_fixes(run_id: str, db: Session = Depends(get_db)):
    fixes = crud.get_fixes_by_run(db, run_id=run_id)

    formatted_fixes = []
    for fix in fixes:
        issue_desc = f"{fix.bug_type} error in {fix.file_path}"
        if fix.line_number:
            issue_desc += f" line {fix.line_number}"

        formatted_message = f"{issue_desc} → Fix: {fix.commit_message or 'applied fix'}"

        formatted_fixes.append({
            "id": fix.id,
            "iteration_id": fix.iteration_id,
            "formatted_message": formatted_message,
            "file": fix.file_path,
            "bug_type": fix.bug_type,
            "line_number": fix.line_number,
            "commit_message": fix.commit_message,
            "status": fix.status,
            "confidence_score": fix.confidence_score,
            "created_at": str(fix.created_at) if fix.created_at else None
        })

    return formatted_fixes


# ---------------- ITERATIONS ---------------- #

@router.get("/iterations/{run_id}")
def get_iterations(run_id: str, db: Session = Depends(get_db)):
    return crud.get_iterations_by_run(db, run_id=run_id)


# ---------------- RESULTS ---------------- #

@router.get("/results/{run_id}")
async def get_results(run_id: str):
<<<<<<< HEAD
    if not RUN_ID_PATTERN.match(run_id):
        return {"status": "not found"}
    results_dir = os.path.abspath("results")
    candidate = os.path.abspath(os.path.join(results_dir, f"{run_id}.json"))
    if candidate.startswith(results_dir + os.sep) and os.path.exists(candidate):
        with open(candidate, "r") as f:
=======
    results_path = os.path.join("results", f"{run_id}.json")

    if os.path.exists(results_path):
        with open(results_path, "r") as f:
>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
            return json.load(f)

    return {"status": "not found"}


# ---------------- HISTORY ---------------- #

@router.get("/history")
async def get_history(request: Request, db: Session = Depends(get_db)):
    try:
        await verify_token(request)
        user_id = get_user_id(request)
<<<<<<< HEAD
        # TODO: scope runs to user_id once User model / foreign key is added
=======

>>>>>>> c50198c6af1b48dfcfbbdad9edfd4f5b1265b7fc
        runs = crud.get_runs(db, limit=50)
        return {"runs": runs}

    except Exception as e:
        return {"error": str(e)}