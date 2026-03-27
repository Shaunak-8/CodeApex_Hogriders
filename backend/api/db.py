import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def ensure_user(user_id: str, email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (id, email) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
                (user_id, email)
            )
        conn.commit()
    finally:
        conn.close()

def create_run(run_id: str, user_id: str, repo_url: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO runs (id, user_id, repo_url, status, start_time) VALUES (%s, %s, %s, 'STARTED', NOW())",
                (run_id, user_id, repo_url)
            )
        conn.commit()
    finally:
        conn.close()

def update_run_result(run_id: str, result: dict):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE runs SET 
                    status = %s, 
                    total_failures = %s, 
                    total_fixes = %s, 
                    score_total = %s, 
                    results_json = %s, 
                    end_time = NOW() 
                WHERE id = %s
                """,
                (
                    result.get("status"),
                    result.get("total_failures"),
                    result.get("total_fixes"),
                    result.get("score", {}).get("final"),
                    json.dumps(result),
                    run_id
                )
            )
            
            # Insert individual fixes
            for f in result.get("fixes", []):
                cur.execute(
                    """
                    INSERT INTO fixes (run_id, file, bug_type, agent_used, confidence, blast_radius, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        run_id,
                        f.get("file"),
                        f.get("bug_type"),
                        f.get("agent", "Specialist"),
                        f.get("confidence", 0),
                        f.get("blast_radius", 1),
                        f.get("status")
                    )
                )
        conn.commit()
    finally:
        conn.close()

def get_user_runs(user_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM runs WHERE user_id = %s ORDER BY start_time DESC", (user_id,))
            return cur.fetchall()
    finally:
        conn.close()
