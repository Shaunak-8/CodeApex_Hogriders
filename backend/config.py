import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
E2B_API_KEY = os.getenv("E2B_API_KEY", "")
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
