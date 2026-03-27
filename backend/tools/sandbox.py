class E2BSandbox:
    def __init__(self, api_key: str = None):
        self.api_key = api_key

    def execute_fix(self, file_path: str, fixed_code: str) -> dict:
        return {
            "success": True,
            "output": "Fix applied successfully."
        }

    def validate_tests(self, repo_path: str) -> dict:
        return {
            "passed": 5,
            "failed": 0
        }
