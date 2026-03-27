from pydantic import BaseModel
from typing import List
import instructor
from groq import Groq
import os

class TaskItem(BaseModel):
    description: str
    rationale: str

class WorkspaceRoadmap(BaseModel):
    summary: str
    tasks: List[TaskItem]

class RCAAnalysis(BaseModel):
    root_cause: str
    impact: str
    long_term_fix: str

class InfraConfig(BaseModel):
    language: str
    dockerfile: str
    github_actions: str

def get_instructor_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured for WorkspaceAgent")
    client = Groq(api_key=api_key)
    return instructor.from_groq(client, mode=instructor.Mode.JSON)

def analyze_workspace(repo_url: str, user_prompt: str) -> WorkspaceRoadmap:
    instructor_client = get_instructor_client()
    system_prompt = "You are an elite AI Technical Product Manager. Break down user goals into concrete, actionable technical tasks."
    prompt = f"""
    Repository Context: {repo_url}
    User Goal: {user_prompt}
    
    Create a structured execution roadmap for this goal. Output a summary and a list of specific sub-tasks.
    Keep task descriptions actionable and developer-ready (e.g. "Implement GET /api/users endpoint").
    """
    
    return instructor_client.chat.completions.create(
        model="llama3-70b-8192",
        response_model=WorkspaceRoadmap,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

def generate_rca(error_log: str) -> RCAAnalysis:
    instructor_client = get_instructor_client()
    prompt = f"Analyze the following error log and provide a detailed Root Cause Analysis:\n\n{error_log}"
    
    return instructor_client.chat.completions.create(
        model="llama3-70b-8192",
        response_model=RCAAnalysis,
        messages=[{"role": "system", "content": "You are a Senior SRE."}, {"role": "user", "content": prompt}],
        temperature=0.1
    )

def generate_infra(repo_context: str) -> InfraConfig:
    instructor_client = get_instructor_client()
    prompt = f"Based on this repository info, generate a Dockerfile and GitHub Actions workflow and specify the primary language:\n\n{repo_context}"
    
    return instructor_client.chat.completions.create(
        model="llama3-70b-8192",
        response_model=InfraConfig,
        messages=[{"role": "system", "content": "You are a DevOps Engineer."}, {"role": "user", "content": prompt}],
        temperature=0.2
    )
