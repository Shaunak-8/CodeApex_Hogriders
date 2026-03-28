import psycopg2
import uuid
from psycopg2.extras import RealDictCursor
import os
import json
from datetime import datetime
from dotenv import load_dotenv

def get_db_connection():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set in .env")
    return psycopg2.connect(db_url)


def _resolve_pg_enum_value(conn, enum_type_name: str, desired_value: str, fallback_value: str | None = None) -> str:
    """
    Resolve a PostgreSQL enum label in a case-insensitive way.
    This protects us from environments where enum labels were created
    as uppercase/lowercase variants across different migrations.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT e.enumlabel
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = %s
            ORDER BY e.enumsortorder
            """,
            (enum_type_name,),
        )
        labels = [row[0] for row in cur.fetchall()]

    if not labels:
        return fallback_value or desired_value

    desired_lower = desired_value.lower()
    for label in labels:
        if label.lower() == desired_lower:
            return label

    if fallback_value:
        fallback_lower = fallback_value.lower()
        for label in labels:
            if label.lower() == fallback_lower:
                return label

    return labels[0]

# --- USERS ---
def ensure_user(user_id: str, email: str, profile_data: dict = None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (id, email, profile_data) 
                VALUES (%s, %s, %s) 
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
                """,
                (user_id, email, json.dumps(profile_data or {}))
            )
        conn.commit()
    finally:
        conn.close()

# --- PROJECTS ---
def create_project(user_id: str, repo_url: str, name: str, tags: list, visibility: str = 'private'):
    conn = get_db_connection()
    try:
        visibility_val = visibility.value if hasattr(visibility, 'value') else visibility
        project_id = str(uuid.uuid4())[:8]
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO projects (id, user_id, repo_url, name, tags, visibility) 
                VALUES (%s, %s, %s, %s, %s::json, %s) RETURNING *
                """,
                (project_id, user_id, repo_url, name, json.dumps(tags), visibility_val)
            )
            project = cur.fetchone()
        conn.commit()
        return project
    finally:
        conn.close()

def get_projects(user_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM projects WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            return cur.fetchall()
    finally:
        conn.close()

def get_project(project_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
            return cur.fetchone()
    finally:
        conn.close()

# --- RUNS ---
def create_run(run_id: str, project_id: str, repo_url: str, team_name: str, leader_name: str, branch_name: str = "main"):
    conn = get_db_connection()
    try:
        run_status = _resolve_pg_enum_value(conn, "runstatusenum", "running", "pending")
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO runs (id, project_id, repo_url, team_name, leader_name, branch_name, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (run_id, project_id, repo_url, team_name, leader_name, branch_name, run_status)
            )
            run = cur.fetchone()
        conn.commit()
        return run
    finally:
        conn.close()

def update_run_result(run_id: str, status: str, result_json: dict):
    conn = get_db_connection()
    try:
        status_val = status.value if hasattr(status, 'value') else status
        db_status = _resolve_pg_enum_value(conn, "runstatusenum", str(status_val), "completed")
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "UPDATE runs SET status = %s, results_json = %s WHERE id = %s",
                    (db_status, json.dumps(result_json), run_id)
                )
            except Exception:
                # Backward compatibility: Rollback failed transaction before trying fallback
                conn.rollback()
                with conn.cursor() as cur2:
                    cur2.execute(
                        "UPDATE runs SET status = %s WHERE id = %s",
                        (db_status, run_id)
                    )
        conn.commit()
    finally:
        conn.close()

def get_latest_run(project_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM runs WHERE project_id = %s ORDER BY created_at DESC LIMIT 1", (project_id,))
            return cur.fetchone()
    finally:
        conn.close()

# --- ISSUES & TASKS ---
def get_project_stats(project_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) as run_count FROM runs WHERE project_id = %s", (project_id,))
            runs = cur.fetchone()['run_count']
            
            cur.execute("SELECT COUNT(*) as issue_count FROM issues WHERE project_id = %s", (project_id,))
            issues = cur.fetchone()['issue_count']
            
            return {"runs": runs, "issues": issues}
    finally:
        conn.close()

def create_issue(project_id: str, file: str, severity: str, status: str = 'open', assigned_to: str = 'Unassigned'):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO issues (project_id, file, severity, status, assigned_to) 
                VALUES (%s, %s, %s, %s, %s) RETURNING *
                """,
                (project_id, file, severity, status, assigned_to)
            )
            issue = cur.fetchone()
        conn.commit()
        return issue
    finally:
        conn.close()

def create_task(project_id: str, description: str, status: str = 'todo'):
    conn = get_db_connection()
    try:
        status_val = status.value if hasattr(status, 'value') else status
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO tasks (project_id, description, status) 
                VALUES (%s, %s, %s) RETURNING *
                """,
                (project_id, description, status_val)
            )
            task = cur.fetchone()
        conn.commit()
        return task
    finally:
        conn.close()

def get_tasks(project_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM tasks WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
            return cur.fetchall()
    finally:
        conn.close()

def update_task_status(task_id: str, status: str):
    conn = get_db_connection()
    try:
        status_val = status.value if hasattr(status, 'value') else status
        with conn.cursor() as cur:
            cur.execute("UPDATE tasks SET status = %s WHERE id = %s", (status_val, task_id))
        conn.commit()
    finally:
        conn.close()

def get_heatmap_stats():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    DATE(created_at) as date, 
                    COUNT(*) as count 
                FROM runs 
                WHERE created_at >= CURRENT_DATE - INTERVAL '156 days'
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC;
                """
            )
            return cur.fetchall()
    finally:
        conn.close()
