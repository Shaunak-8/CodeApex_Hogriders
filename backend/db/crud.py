from sqlalchemy.orm import Session
from db import models
from typing import Optional

# ============
# RUN CRUD
# ============

def create_run(db: Session, run_id: str, repo_url: str, team_name: str, leader_name: str, branch_name: str = "main"):
    db_run = models.Run(
        id=run_id,
        repo_url=repo_url,
        team_name=team_name,
        leader_name=leader_name,
        branch_name=branch_name,
        status="running"
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

def get_runs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Run).order_by(models.Run.created_at.desc()).offset(skip).limit(limit).all()

def get_run(db: Session, run_id: str):
    return db.query(models.Run).filter(models.Run.id == run_id).first()

def update_run(db: Session, run_id: str, status: Optional[str] = None, overall_score: Optional[float] = None, memory: Optional[dict] = None):
    db_run = get_run(db, run_id)
    if not db_run:
        raise ValueError(f"Run with id '{run_id}' not found")
    if status is not None:
        db_run.status = status
    if overall_score is not None:
        db_run.overall_score = overall_score
    if memory is not None:
        db_run.memory = memory
    db.commit()
    db.refresh(db_run)
    return db_run

# ============
# ITERATION CRUD
# ============

def create_iteration(db: Session, run_id: str, iteration_number: int):
    db_iter = models.Iteration(
        run_id=run_id,
        iteration_number=iteration_number,
        status="running"
    )
    db.add(db_iter)
    db.commit()
    db.refresh(db_iter)
    return db_iter

def update_iteration(db: Session, iteration_id: int, status: Optional[str] = None, logs: Optional[str] = None):
    db_iter = db.query(models.Iteration).filter(models.Iteration.id == iteration_id).first()
    if db_iter:
        if status is not None:
            db_iter.status = status
        if logs is not None:
            db_iter.logs = logs
        db.commit()
        db.refresh(db_iter)
    return db_iter

def get_iterations_by_run(db: Session, run_id: str):
    return db.query(models.Iteration).filter(models.Iteration.run_id == run_id).order_by(models.Iteration.iteration_number.asc()).all()

# ============
# FIX CRUD
# ============

def create_fix(
    db: Session, 
    run_id: str, 
    iteration_id: int, 
    file_path: str, 
    bug_type: str, 
    line_number: Optional[int] = None, 
    commit_message: Optional[str] = None,
    confidence_score: Optional[float] = None,
    status: str = "applied"
):
    db_fix = models.Fix(
        run_id=run_id,
        iteration_id=iteration_id,
        file_path=file_path,
        bug_type=bug_type,
        line_number=line_number,
        commit_message=commit_message,
        confidence_score=confidence_score,
        status=status
    )
    db.add(db_fix)
    db.commit()
    db.refresh(db_fix)
    return db_fix

def get_fixes_by_run(db: Session, run_id: str):
    return db.query(models.Fix).filter(models.Fix.run_id == run_id).order_by(models.Fix.created_at.asc()).all()
