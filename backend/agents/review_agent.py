import os
import instructor
from groq import Groq
import google.generativeai as genai

from pydantic import BaseModel
from typing import List

class ReviewIssue(BaseModel):
    file: str
    severity: str  # e.g., 'high', 'medium', 'low'
    description: str

class ReviewResult(BaseModel):
    issues: List[ReviewIssue]

def analyze_diff(diff_text: str) -> ReviewResult:
    """Analyze a code diff for secrets, bad practices, and bugs."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if gemini_key and gemini_key != "your_gemini_api_key_here":
        genai.configure(api_key=gemini_key)
        model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        client = genai.GenerativeModel(model)
        instructor_client = instructor.from_gemini(client, mode=instructor.Mode.GEMINI_JSON)
    elif groq_key:
        client = Groq(api_key=groq_key)
        instructor_client = instructor.from_groq(client, mode=instructor.Mode.JSON)
        model = "llama3-70b-8192"
    else:
        raise ValueError("No LLM API keys configured (GEMINI_API_KEY or GROQ_API_KEY)")


    system_prompt = "You are a ruthlessly efficient Senior Security and QA Engineer. Analyze code diffs and strictly report critical issues like exposed secrets, major logic flaws, or highly insecure practices. If the code looks fine, return an empty list."
    prompt = f"""
    Please perform a strict code review on the following git diff.
    Look out for:
    1. Hardcoded API keys or secrets
    2. SQL Injections or raw vulnerable queries
    3. Obviously broken logic
    
    <diff>
    {diff_text}
    </diff>
    """
    
    response = instructor_client.chat.completions.create(
        model=model,
        response_model=ReviewResult,

        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1
    )
    
    return response
