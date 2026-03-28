import os
from dotenv import load_dotenv

# Load environment variables from .env file with FORCE OVERRIDE
# This ensures shell-level stale tokens don't leak into the app
load_dotenv(override=True)

# Explicitly re-read from .env for critical tokens
import dotenv
env_values = dotenv.dotenv_values(".env")

GROQ_API_KEY = env_values.get("GROQ_API_KEY") or os.getenv("GROQ_API_KEY", "")
GITHUB_TOKEN = env_values.get("GITHUB_TOKEN") or os.getenv("GITHUB_TOKEN", "")
E2B_API_KEY = env_values.get("E2B_API_KEY") or os.getenv("E2B_API_KEY", "")

# Ensure the system-level environ is also updated for subprocesses
if env_values.get("GITHUB_TOKEN"):
    os.environ["GITHUB_TOKEN"] = env_values.get("GITHUB_TOKEN")

MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Gemini Integration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
PORT = int(os.getenv("PORT", "8000"))
