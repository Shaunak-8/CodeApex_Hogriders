from pydantic import BaseModel
from typing import List
import instructor
from groq import Groq
import google.generativeai as genai
import os
import logging
import config

logger = logging.getLogger(__name__)



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
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        genai.configure(api_key=gemini_key)
        model_name = config.GEMINI_MODEL
        client = genai.GenerativeModel(model_name)
        return instructor.from_gemini(client, mode=instructor.Mode.GEMINI_JSON), model_name
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise ValueError("No LLM API keys configured (GEMINI_API_KEY or GROQ_API_KEY)")
    client = Groq(api_key=groq_key)
    return instructor.from_groq(client, mode=instructor.Mode.JSON), config.GROQ_MODEL


def analyze_workspace(repo_url: str, user_prompt: str) -> WorkspaceRoadmap:
    instructor_client, model = get_instructor_client()
    system_prompt = "You are an elite AI Technical Product Manager. Break down user goals into concrete, actionable technical tasks."
    prompt = f"""
    Repository Context: {repo_url}
    User Goal: {user_prompt}
    
    Create a structured execution roadmap for this goal. Output a summary and a list of specific sub-tasks.
    Keep task descriptions actionable and developer-ready (e.g. "Implement GET /api/users endpoint").
    """
    
    try:
        return instructor_client.chat.completions.create(
            model=model,
            response_model=WorkspaceRoadmap,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
    except Exception as e:
        logger.error(f"Error in analyze_workspace (model: {model}): {str(e)}", exc_info=True)
        return WorkspaceRoadmap(
            summary=f"Failed to generate roadmap due to provider error: {str(e)}",
            tasks=[]
        )

def generate_rca(error_log: str, code_context: str = "") -> RCAAnalysis:
    instructor_client, model = get_instructor_client()
    prompt = f"""
    Analyze the following error log and the associated code context to provide a detailed Root Cause Analysis.
    
    ERROR LOG:
    {error_log}
    
    CODE CONTEXT:
    {code_context}
    """
    
    try:
        return instructor_client.chat.completions.create(
            model=model,
            response_model=RCAAnalysis,
            messages=[{"role": "system", "content": "You are a Senior SRE. Be specific and reference the code provided."}, {"role": "user", "content": prompt}],
            temperature=0.1
        )
    except Exception as e:
        logger.error(f"Error in generate_rca (model: {model}): {str(e)}", exc_info=True)
        return RCAAnalysis(
            root_cause="Error generating RCA",
            impact="Unknown",
            long_term_fix="Please check backend logs."
        )

def generate_infra(repo_context: str, file_manifest: dict = None) -> InfraConfig:
    instructor_client, model = get_instructor_client()
    manifest_str = json.dumps(file_manifest, indent=2) if file_manifest else "No manifest provided"
    
    prompt = f"""
    Based on this repository info and file contents, generate a high-performance Dockerfile and GitHub Actions workflow.
    
    REPOSITORY: {repo_context}
    
    FILE MANIFEST (Key Config Files):
    {manifest_str}
    
    Output the primary language, a production-ready Dockerfile, and a CI/CD GitHub Actions workflow.
    """
    
    try:
        return instructor_client.chat.completions.create(
            model=model,
            response_model=InfraConfig,
            messages=[{"role": "system", "content": "You are a Senior DevOps Engineer. Optimize for performance and security."}, {"role": "user", "content": prompt}],
            temperature=0.2
        )
    except Exception as e:
        logger.error(f"Error in generate_infra (model: {model}): {str(e)}", exc_info=True)
        return InfraConfig(
            language="Unknown",
            dockerfile="# Error generating Dockerfile",
            github_actions="# Error generating GitHub Actions"
        )
