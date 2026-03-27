import core.confidence as confidence

class ValidatorAgent:
    def validate(self, repo_path: str, before_results: dict, after_results: dict) -> dict:
        delta = after_results.get("passed", 0) - before_results.get("passed", 0)
        
        if delta >= 0:
            decision = "ACCEPT"
        else:
            decision = "ROLLBACK"
            
        return {
            "decision": decision,
            "delta": delta,
            "reason": f"Test delta was {delta}"
        }
