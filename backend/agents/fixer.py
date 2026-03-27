import os
import json
from groq import Groq

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
        
        prompt = f"""
        FAILURE:
        File: {failure['file']}
        Line: {failure.get('line', 'unknown')}
        Type: {failure['bug_type']}
        Message: {failure['error_message']}

        CONTEXT:
        {context['primary']}

        IMPORTS/DEPENDENCIES:
        {json.dumps(context['imports'], indent=2)}

        PREVIOUS FAILED STRATEGIES:
        {json.dumps(history if history else [], indent=2)}

        INSTRUCTION:
        Provide a fix for the failure. Respond ONLY with a JSON object:
        {{
            "fixed_code": "the entire improved file content",
            "explanation": "brief description of fix",
            "confidence": 0-100,
            "blast_radius": 1-10
        }}
        """

        try:
            response = self.groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama3-70b-8192"),
                messages=[
                    {"role": "system", "content": self.system_prompt.format(specialty=self.specialty)},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Fixer error: {e}")
            return {}

class PythonFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Python"

class TypeFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Static Typing (mypy)"

class SyntaxFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Syntax & Parser"

class LogicFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Logic & Algorithm"

class ImportFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Dependency & Packaging"

class JSFixerAgent(BaseFixerAgent):
    def __init__(self, groq_client, context_builder):
        super().__init__(groq_client, context_builder)
        self.specialty = "Javascript/Typescript"
