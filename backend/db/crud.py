from sqlalchemy.orm import Session
from sqlalchemy import text
from db import models
from typing import Optional
from types import SimpleNamespace

def _resolve_enum_label(db: Session, enum_type_name: str, desired_value: str, fallback_value: Optional[str] = None) -> str:
    rows = db.execute(
        text(
            """
            SELECT e.enumlabel
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = :enum_type_name
            ORDER BY e.enumsortorder
            """
        ),
        {"enum_type_name": enum_type_name},
    ).fetchall()
    labels = [row[0] for row in rows]

    if not labels:
        return fallback_value or desired_value

    desired_lower = desired_value.lower()
    
    # Explicit mapping for pass/fail variations to handle "fail" vs "failed" vs "FAIL"
    if desired_lower in ["fail", "failed", "failure"]:
        for label in labels:
            if label.lower() in ["fail", "failed", "failure"]:
                return label
    if desired_lower in ["pass", "passed", "success"]:
        for label in labels:
            if label.lower() in ["pass", "passed", "success"]:
                return label

    for label in labels:
        if label.lower() == desired_lower:
            return label

    return labels[0] if labels else (fallback_value or desired_lower)

# ============
# RUN CRUD
# ============

def create_run(db: Session, run_id: str, repo_url: str, team_name: str, leader_name: str, branch_name: str = "main"):
    run_status = _resolve_enum_label(db, "runstatusenum", "running", "pending")
    db_run = models.Run(
        id=run_id,
        repo_url=repo_url,
        team_name=team_name,
        leader_name=leader_name,
        branch_name=branch_name,
        status=run_status
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

def get_runs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Run).order_by(models.Run.created_at.desc()).offset(skip).limit(limit).all()

def get_run(db: Session, run_id: str):
    return db.query(models.Run).filter(models.Run.id == run_id).first()

def update_run(db: Session, run_id: str, status: Optional[str] = None, overall_score: Optional[float] = None, memory: Optional[dict] = None, total_failures: Optional[int] = None, total_fixes: Optional[int] = None):
    db_run = get_run(db, run_id)
    if not db_run:
        raise ValueError(f"Run with id '{run_id}' not found")

    update_fields = []
    params = {"run_id": run_id}

    if status is not None:
        update_fields.append("status = :status")
        params["status"] = _resolve_enum_label(db, "runstatusenum", str(status), "completed")
    if overall_score is not None:
        update_fields.append("overall_score = :overall_score")
        params["overall_score"] = overall_score
    if memory is not None:
        update_fields.append("memory = :memory")
        params["memory"] = memory
    if total_failures is not None:
        update_fields.append("total_failures = :total_failures")
        params["total_failures"] = total_failures
    if total_fixes is not None:
        update_fields.append("total_fixes = :total_fixes")
        params["total_fixes"] = total_fixes

    if update_fields:
        db.execute(
            text(f"UPDATE runs SET {', '.join(update_fields)} WHERE id = :run_id"),
            params,
        )
        db.commit()

    return get_run(db, run_id)

# ============
# ITERATION CRUD
# ============

def create_iteration(db: Session, run_id: str, iteration_number: int):
    iter_status = _resolve_enum_label(db, "iterationstatusenum", "running", "running")
    row = db.execute(
        text(
            """
            INSERT INTO iterations (run_id, iteration_number, status, logs)
            VALUES (:run_id, :iteration_number, :status, :logs)
            RETURNING id
            """
        ),
        {
            "run_id": run_id,
            "iteration_number": iteration_number,
            "status": iter_status,
            "logs": None,
        },
    ).fetchone()
    db.commit()
    return SimpleNamespace(id=row[0] if row else None)

def update_iteration(db: Session, iteration_id: int, status: Optional[str] = None, logs: Optional[str] = None):
    update_fields = []
    params = {"iteration_id": iteration_id}
    if status is not None:
        update_fields.append("status = :status")
        params["status"] = _resolve_enum_label(db, "iterationstatusenum", str(status), "running")
    if logs is not None:
        update_fields.append("logs = :logs")
        params["logs"] = logs

    if update_fields:
        db.execute(
            text(f"UPDATE iterations SET {', '.join(update_fields)} WHERE id = :iteration_id"),
            params,
        )
        db.commit()
    return db.query(models.Iteration).filter(models.Iteration.id == iteration_id).first()

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
    fix_status = _resolve_enum_label(db, "fixstatusenum", str(status), "applied")
    row = db.execute(
        text(
            """
            INSERT INTO fixes (run_id, iteration_id, file_path, bug_type, line_number, commit_message, status, confidence_score)
            VALUES (:run_id, :iteration_id, :file_path, :bug_type, :line_number, :commit_message, :status, :confidence_score)
            RETURNING id
            """
        ),
        {
            "run_id": run_id,
            "iteration_id": iteration_id,
            "file_path": file_path,
            "bug_type": bug_type,
            "line_number": line_number,
            "commit_message": commit_message,
            "status": fix_status,
            "confidence_score": confidence_score,
        },
    ).fetchone()
    db.commit()
    return SimpleNamespace(id=row[0] if row else None)

def get_fixes_by_run(db: Session, run_id: str):
    return db.query(models.Fix).filter(models.Fix.run_id == run_id).order_by(models.Fix.created_at.asc()).all()
