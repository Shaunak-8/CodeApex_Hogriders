class ContextBuilder:
    def __init__(self, max_tokens: int = 12000):
        self.max_tokens = max_tokens

    def build(self, primary_file: str, repo_path: str) -> dict:
        return {
            "primary": f"content of {primary_file}",
            "imports": [
                {"path": "mock_import_1.py", "content": "mock import content"}
            ],
            "test_file": "def test_mock(): pass",
            "token_count": 500
        }
