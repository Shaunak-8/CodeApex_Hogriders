import psycopg2
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
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO projects (user_id, repo_url, name, tags, visibility) 
                VALUES (%s, %s, %s, %s, %s) RETURNING *
                """,
                (user_id, repo_url, name, tags, visibility)
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
def create_run(project_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO runs (project_id, status) VALUES (%s, 'running') RETURNING *",
                (project_id,)
            )
            run = cur.fetchone()
        conn.commit()
        return run
    finally:
        conn.close()

def update_run_result(run_id: str, status: str, result_json: dict):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE runs SET status = %s, results_json = %s WHERE id = %s",
                (status, json.dumps(result_json), run_id)
            )
        conn.commit()
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
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO tasks (project_id, description, status) 
                VALUES (%s, %s, %s) RETURNING *
                """,
                (project_id, description, status)
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
        with conn.cursor() as cur:
            cur.execute("UPDATE tasks SET status = %s WHERE id = %s", (status, task_id))
        conn.commit()
    finally:
        conn.close()
