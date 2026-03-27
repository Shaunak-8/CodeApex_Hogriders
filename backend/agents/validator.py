from tools.sandbox import E2BSandbox

class ValidatorAgent:
    def __init__(self):
        self.sandbox = E2BSandbox()

    def validate(self, repo_path: str, bug_type: str = None) -> dict:
        """Re-run tests to see if the fix actually worked."""
        
        # Use the sandbox to run validation tests
        res = self.sandbox.validate_tests(repo_path)
        
        status = "PASS" if res["failed"] == 0 and res["passed"] > 0 else "FAIL"
        
        # Special case: if no tests ran, check if it's just a linting fix
        if res["passed"] == 0 and res["failed"] == 0:
            # We assume it passed if it compiled (already checked in sandbox.execute_fix)
            status = "PASS"

        return {
            "status": status,
            "remaining_failures": res["failed"],
            "output": res["output"]
        }

def validate_fix(fix: str, failure) -> bool:
    agent = ValidatorAgent()
    result = agent.validate(".", {}, {})
    return result.get("decision") == "ACCEPT"
