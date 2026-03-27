import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_URL

def get_connection():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    """Initialize database tables if they don't exist."""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT
        );
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            repo_url TEXT,
            status TEXT DEFAULT 'started',
            score_total INTEGER DEFAULT 0,
            results_json JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
    """)
    
    conn.commit()
    cur.close()
    conn.close()

def ensure_user(user_id: str, email: str):
    """Create or update user in the database."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (id, email) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET email = %s",
        (user_id, email, email),
    )
    conn.commit()
    cur.close()
    conn.close()

def create_run(run_id: str, user_id: str, repo_url: str):
    """Insert a new run record."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO runs (id, user_id, repo_url) VALUES (%s, %s, %s)",
        (run_id, user_id, repo_url),
    )
    conn.commit()
    cur.close()
    conn.close()

def get_user_runs(user_id: str):
    """Get all runs for a specific user."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM runs WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]

def update_run(run_id: str, status: str, score_total: int = 0, results_json: dict = None):
    """Update a run's status and results."""
    conn = get_connection()
    cur = conn.cursor()
    import json
    cur.execute(
        "UPDATE runs SET status = %s, score_total = %s, results_json = %s WHERE id = %s",
        (status, score_total, json.dumps(results_json) if results_json else None, run_id),
    )
    conn.commit()
    cur.close()
    conn.close()
