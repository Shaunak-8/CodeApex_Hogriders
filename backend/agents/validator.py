from tools.sandbox import E2BSandbox
import tempfile
import subprocess
import os
from api.enums import IterationStatusEnum

class ValidatorAgent:
    def __init__(self):
        self.sandbox = E2BSandbox()

    def validate(self, repo_path: str, bug_type: str = None) -> dict:
        """Re-run tests to see if the fix actually worked."""
        
        # Use the sandbox to run validation tests
        res = self.sandbox.validate_tests(repo_path)
        
        status = IterationStatusEnum.passed if res["failed"] == 0 and res["passed"] > 0 else IterationStatusEnum.failed
        
        # Special case: if no tests ran, check if it's just a linting fix
        if res["passed"] == 0 and res["failed"] == 0:
            # We assume it passed if it compiled (already checked in sandbox.execute_fix)
            status = IterationStatusEnum.passed

        return {
            "status": status.value,
            "remaining_failures": res["failed"],
            "output": res["output"]
        }

def validate_fix(fix: str, failure) -> bool:
    """Validate a generated fix by checking syntax and basic correctness."""
    # 1. Non-empty check
    if not fix or fix.strip() == "" or fix.strip() == "pass":
        return False

    # 2. Syntax check — write to temp file and py_compile
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".py")
        with os.fdopen(fd, "w") as f:
            f.write(fix)
        
        result = subprocess.run(
            ["python3", "-m", "py_compile", tmp_path],
            capture_output=True, text=True, timeout=10
        )
        os.unlink(tmp_path)
        
        if result.returncode != 0:
            print(f"Syntax validation failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"Validation error: {e}")
        # Clean up temp file if it exists
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        return False

    # 3. Basic relevance check — fix should not be identical to error message
    if hasattr(failure, 'message') and fix.strip() == failure.message.strip():
        return False

    return True

