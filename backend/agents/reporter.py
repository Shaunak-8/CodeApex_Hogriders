import json
import os
from datetime import datetime
from api.enums import IterationStatusEnum, parse_iteration_status

class ReporterAgent:
    def build_results(self, run_id: str, repo_url: str, final_status: str, iterations: int, 
                      failures_log: list, fixes: list, 
                      health_score: dict = None, causal_graph: dict = None, branch_name: str = "main") -> dict:
        total_failures = len(failures_log)
        total_fixes = len([f for f in fixes if f.get("status") == "applied"])
        
        it_status = parse_iteration_status(final_status)
        # Calculate scores
        base_score = 100
        bonus = 10 if it_status == IterationStatusEnum.passed and iterations < 3 else 0
        penalty = (iterations - 1) * 5 if iterations > 1 else 0
        final_score = max(0, base_score + bonus - penalty)

        results = {
            "run_id": run_id,
            "repo_url": repo_url,
            "status": it_status.value,
            "total_failures": total_failures,
            "total_fixes": total_fixes,
            "iterations": iterations,
            "score": {
                "base": base_score,
                "bonus": bonus,
                "penalty": penalty,
                "final": final_score,
                "total": final_score,  # alias for frontend compat
            },
            "health_score": health_score or {"before": 0, "after": 0},
            "causal_graph": causal_graph or {"nodes": [], "edges": []},
            "fixes": fixes,
            "branch": branch_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        os.makedirs("results", exist_ok=True)
        with open(os.path.join("results", f"{run_id}.json"), "w") as f:
            json.dump(results, f, indent=4)
            
        return results

def report_result(attempt: int, success: bool, fix: str):
    """Wrapper for CLI orchestrator. Prints result and saves to disk."""
    agent = ReporterAgent()
    agent.build_results(
        run_id=f"cli_attempt_{attempt}",
        repo_url="local",
        final_status=IterationStatusEnum.passed.value if success else IterationStatusEnum.fail.value,
        iterations=attempt,
        failures_log=[],
        fixes=[{"status": "applied", "fixed_code": fix}] if success else []
    )
