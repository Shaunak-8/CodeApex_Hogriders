import os
import re
from groq import Groq
import google.generativeai as genai
import config

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

    def __init__(self, groq_client: Groq, context_builder, gemini_model=None):
        self.groq_client = groq_client
        self.gemini_model = gemini_model
        self.context_builder = context_builder


    def fix(self, failure: dict, repo_path: str, history: list = None) -> dict:
        if not self.groq_client and not self.gemini_model:
            # No LLM configured; run without auto-fix capability.
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
            if self.gemini_model:
                try:
                    response = self.gemini_model.generate_content(prompt)
                    fixed_code = response.text.strip()
                except Exception as ge:
                    print(f"Gemini API error: {ge}. Falling back to Groq if possible.")
                    if not self.groq_client: return {}
                    response = self.groq_client.chat.completions.create(
                        model=config.GROQ_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.0
                    )
                    fixed_code = response.choices[0].message.content.strip()
            else:
                response = self.groq_client.chat.completions.create(
                    model=config.GROQ_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0
                )
                fixed_code = response.choices[0].message.content.strip()

            
            # Robust code extraction
            # 1. Try flexible regex (handles space before language tag and optional newlines)
            code_match = re.search(r"```[ \t]*(?:\w+)?[ \t]*\n?(.*?)\s*```", fixed_code, re.DOTALL)
            if code_match:
                fixed_code = code_match.group(1).strip()
            else:
                # 2. Fallback: Manual block extraction
                lines = fixed_code.splitlines()
                if len(lines) >= 2 and lines[0].startswith("```") and lines[-1].startswith("```"):
                    # Extract everything between the first and last lines
                    fixed_code = "\n".join(lines[1:-1]).strip()
                else:
                    # 3. Last resort: just strip backticks
                    fixed_code = fixed_code.replace("```", "").strip()

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
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    prompt = f"""
Fix the following python code failure.
File: {failure.file}
Line: {failure.line}
Error: {failure.error_type} - {failure.message}
Context:
{context}

Return ONLY the fixed python code snippet. No markdown blocks, no explanations.
"""

    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel(config.GEMINI_MODEL)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini error in generate_fix: {e}. Falling back to Groq.")

    if not groq_key:
        print("WARNING: No LLM API keys configured. Returning dummy fix.")
        return "# Dummy fix generated\npass"

    try:
        client = Groq(api_key=groq_key)
        response = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return ""
