import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
E2B_API_KEY = os.getenv("E2B_API_KEY", "")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
