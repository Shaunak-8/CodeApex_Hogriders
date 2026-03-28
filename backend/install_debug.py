import subprocess
import os

reqs = [
    "uvicorn", "fastapi", "sqlalchemy", "python-dotenv", 
    "pydantic-settings", "sse-starlette", "gitpython", 
    "supabase", "python-jose[cryptography]", "psycopg2-binary", 
    "google-generativeai", "watchfiles"
]

with open("install_debug.log", "w") as f:
    f.write("Starting installation...\n")
    for req in reqs:
        f.write(f"Installing {req}...\n")
        res = subprocess.run(["python", "-m", "pip", "install", req], capture_output=True, text=True)
        f.write(f"STDOUT: {res.stdout}\n")
        f.write(f"STDERR: {res.stderr}\n")
    f.write("Done.\n")
