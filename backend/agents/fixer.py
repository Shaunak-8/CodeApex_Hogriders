import os
from openai import OpenAI
from agents.schema import FailureRecord

class FixerRouter:
    @staticmethod
    def route(bug_type: str):
        mapping = {
            "LINTING": PythonFixerAgent,
            "TYPE_ERROR": TypeFixerAgent,
            "SYNTAX": SyntaxFixerAgent,
            "LOGIC": LogicFixerAgent,
            "IMPORT": ImportFixerAgent,
            "JS": JSFixerAgent
        }
        return mapping.get(bug_type, PythonFixerAgent)

class BaseFixerAgent:
    def __init__(self, groq_client: Groq, context_builder):
        self.groq_client = groq_client
        self.context_builder = context_builder
        self.system_prompt = "You are a senior {specialty} engineer. Fix the provided code failure."
        self.specialty = "software"
        
    def fix(self, failure: dict, repo_path: str, history: list = None) -> dict:
        # Build context
        file_path = os.path.join(repo_path, failure["file"])
        context = self.context_builder.build(file_path, repo_path)
        
    def fix(self, failure, context_bundle) -> dict:
        for _ in range(3):
            try:
                # Mock Groq response
                return {
                    "bug_type": failure["bug_type"],
                    "lines_changed": 5,
                    "touches_imports": False,
                    "blast_radius": 1,
                    "fixed_code": "def fixed(): pass"
                }
            except Exception:
                continue
        return {}

class PythonFixerAgent(BaseFixerAgent): pass
class TypeFixerAgent(BaseFixerAgent): pass
class SyntaxFixerAgent(BaseFixerAgent): pass
class LogicFixerAgent(BaseFixerAgent): pass
class ImportFixerAgent(BaseFixerAgent): pass
class JSFixerAgent(BaseFixerAgent): pass

def generate_fix(context: str, failure: FailureRecord) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY not set. Returning dummy fix.")
        return "# Dummy fix generated\npass"

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

    prompt = f"""
Fix the following python code failure.
File: {failure.file}
Line: {failure.line}
Error: {failure.error_type} - {failure.message}
Context:
{context}

Return ONLY the fixed python code snippet. No markdown blocks, no explanations.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return ""
