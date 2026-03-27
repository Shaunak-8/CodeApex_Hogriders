import os
from groq import Groq
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
    specialty = "software"

    def __init__(self, groq_client: Groq, context_builder):
        self.groq_client = groq_client
        self.context_builder = context_builder

    def fix(self, failure: dict, repo_path: str, history: list = None) -> dict:
        if not self.groq_client:
            # Groq not configured; run without auto-fix capability.
            return {}
        # Build context
        file_path = os.path.join(repo_path, failure["file"])
        context = self.context_builder.build(failure["file"], repo_path)

        # Build prompt
        history_str = ""
        if history:
            history_str = "\nPrevious failed attempts:\n" + "\n".join(
                [f"- {h['fix'][:100]}... -> {h['result']}" for h in history]
            )

        prompt = f"""You are a senior {self.specialty} engineer. Fix the following code failure.

File: {failure['file']}
Bug type: {failure['bug_type']}
Error: {failure.get('message', 'Unknown')}

Source code:
{context.get('primary', '')}

Test file:
{context.get('test_file', 'N/A')}
{history_str}

Return ONLY the complete fixed file content. No markdown, no explanations."""

        try:
            response = self.groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama3-8b-8192"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            fixed_code = response.choices[0].message.content.strip()
            
            # Strip markdown fences if present
            if fixed_code.startswith("```"):
                lines = fixed_code.split("\n")
                fixed_code = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

            return {
                "fixed_code": fixed_code,
                "explanation": f"Fixed {failure['bug_type']} in {failure['file']}",
                "lines_changed": len(fixed_code.splitlines()),
                "touches_imports": "import" in fixed_code[:200],
                "blast_radius": 1
            }
        except Exception as e:
            print(f"Groq API error: {e}")
            return {}

class PythonFixerAgent(BaseFixerAgent):
    specialty = "Python"

class TypeFixerAgent(BaseFixerAgent):
    specialty = "Python typing"

class SyntaxFixerAgent(BaseFixerAgent):
    specialty = "Python syntax"

class LogicFixerAgent(BaseFixerAgent):
    specialty = "Python logic"

class ImportFixerAgent(BaseFixerAgent):
    specialty = "Python imports"

class JSFixerAgent(BaseFixerAgent):
    specialty = "JavaScript"

# --- Standalone generate_fix for CLI orchestrator ---

def generate_fix(context: str, failure: FailureRecord) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY not set. Returning dummy fix.")
        return "# Dummy fix generated\npass"

    client = Groq(api_key=api_key)

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
            model=os.getenv("GROQ_MODEL", "llama3-8b-8192"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return ""
