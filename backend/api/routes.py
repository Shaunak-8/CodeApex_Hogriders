import threading
import uuid
import os
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from db.db import get_db, SessionLocal
from db import crud
from db import models

import agents.orchestrator as orchestrator
try:
    from api.auth import verify_token, get_user_id
except ImportError:
    # Handle if missing
    async def verify_token(req): pass
    def get_user_id(req): return None

router = APIRouter()

class RunRequest(BaseModel):
    repo_url: str
    team_name: str = ""
    leader_name: str = ""
    branch_name: str = "main"

def background_agent_run(run_id: str, repo_url: str, branch_name: str):
    """Background task to run the agent pipeline with its own dedicated DB session."""
    db = SessionLocal()
    try:
        orch = orchestrator.OrchestratorAgent(db=db)
        orch.run(run_id=run_id, repo_url=repo_url, branch_name=branch_name)
    finally:
        db.close()

@router.post("/run")
@router.post("/run-agent") # alias
async def run_agent(request_body: RunRequest, request: Request, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Try to verify token, but allow unauthenticated
    user_id = None
    try:
        await verify_token(request)
        user_id = get_user_id(request)
    except Exception:
        pass
    
    run_id = str(uuid.uuid4())[:8]
    
    # Track the run in database immediately
    crud.create_run(
        db, 
        run_id=run_id,
        repo_url=request_body.repo_url, 
        team_name=request_body.team_name, 
        leader_name=request_body.leader_name,
        branch_name=request_body.branch_name
    )
    
    bg_tasks.add_task(background_agent_run, run_id, request_body.repo_url, request_body.branch_name)
    
    return { 
        "run_id": run_id, 
        "status": "started",
        "branch": request_body.branch_name
    }

@router.get("/runs")
def get_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Returns all runs"""
    return crud.get_runs(db, skip=skip, limit=limit)

@router.get("/runs/{run_id}")
@router.get("/status/{run_id}") # upstream alias
def get_status(run_id: str, db: Session = Depends(get_db)):
    """Returns run summary mapping upstream properties dynamically if possible"""
    db_run = crud.get_run(db, run_id=run_id)
    if db_run:
        return {"run_id": run_id, "status": db_run.status, "score": db_run.overall_score, "db_record": db_run}

    # fallback
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            data = json.load(f)
        return {"run_id": run_id, "status": "completed", "score": data.get("score", 0)}
    return {"run_id": run_id, "status": "running"}

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
            "created_at": fix.created_at
        })
    return formatted_fixes

@router.get("/iterations/{run_id}")
def get_iterations(run_id: str, db: Session = Depends(get_db)):
    return crud.get_iterations_by_run(db, run_id=run_id)

@router.get("/results/{run_id}")
async def get_results(run_id: str):
    results_path = os.path.join("results", f"{run_id}.json")
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            return json.load(f)
    return {"status": "not found"}

@router.get("/history")
async def get_history(request: Request, db: Session = Depends(get_db)):
    """Get run history for authenticated user."""
    try:
        await verify_token(request)
        user_id = get_user_id(request)
        # Using DB
        runs = crud.get_runs(db, limit=50) # Fallback simplistic logic
        return {"runs": runs}
    except Exception as e:
        return {"runs": [], "error": str(e)}
