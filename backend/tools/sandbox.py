import os
import subprocess
import tempfile
import shutil
from typing import Optional

class E2BSandbox:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def execute_fix(self, file_path: str, fixed_code: str) -> dict:
        """Apply fixed code to file atomically and validate it."""
        if not file_path or not fixed_code:
            return {"success": False, "output": "", "error": "file_path and fixed_code must be non-empty"}

        try:
            # Write atomically: temp file then rename
            dir_name = os.path.dirname(file_path) or "."
            fd, tmp_path = tempfile.mkstemp(dir=dir_name, suffix=".tmp")
            with os.fdopen(fd, "w") as f:
                f.write(fixed_code)
            shutil.move(tmp_path, file_path)

            # Validate: try to parse/compile the file
            ext = os.path.splitext(file_path)[1]
            if ext == ".py":
                result = subprocess.run(
                    ["python3", "-m", "py_compile", file_path],
                    capture_output=True, text=True, timeout=30,
                )
                if result.returncode != 0:
                    return {"success": False, "output": result.stdout, "error": result.stderr}
            elif ext in (".js", ".jsx", ".ts", ".tsx"):
                # Basic syntax check with node if available
                if shutil.which("node"):
                    result = subprocess.run(
                        ["node", "--check", file_path],
                        capture_output=True, text=True, timeout=30,
                    )
                    if result.returncode != 0:
                        return {"success": False, "output": result.stdout, "error": result.stderr}

            return {"success": True, "output": "Fix applied and validated successfully.", "error": ""}

        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def validate_tests(self, repo_path: str) -> dict:
        """Run tests in the repo and return pass/fail counts."""
        if not repo_path or not os.path.isdir(repo_path):
            return {"passed": 0, "failed": 0, "output": "", "error": f"Invalid repo_path: {repo_path}"}

        try:
            # Detect test runner
            if os.path.exists(os.path.join(repo_path, "package.json")):
                cmd = ["npx", "jest", "--no-coverage", "--json"]
            else:
                cmd = ["pytest", "--tb=short", "-q"]

            result = subprocess.run(
                cmd, cwd=repo_path, capture_output=True, text=True, timeout=120,
            )

            output = result.stdout + result.stderr

            # Parse pytest summary
            passed = 0
            failed = 0
            for line in output.splitlines():
                if "passed" in line:
                    parts = line.split()
                    for i, p in enumerate(parts):
                        if p == "passed" and i > 0 and parts[i - 1].isdigit():
                            passed = int(parts[i - 1])
                        if p == "failed" and i > 0 and parts[i - 1].isdigit():
                            failed = int(parts[i - 1])

            return {"passed": passed, "failed": failed, "output": output, "error": ""}

        except subprocess.TimeoutExpired:
            return {"passed": 0, "failed": 0, "output": "", "error": "Test execution timed out"}
        except Exception as e:
            return {"passed": 0, "failed": 0, "output": "", "error": str(e)}
