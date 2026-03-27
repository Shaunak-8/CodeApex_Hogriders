import json
import os
from datetime import datetime

class ReporterAgent:
    def build_results(self, run_id: str, repo_url: str, final_status: str, iterations: int, failures_log: list, fixes: list) -> dict:
        total_failures = len(failures_log)
        total_fixes = len([f for f in fixes if f.get("status") == "applied"])
        
        # Calculate scores
        base_score = 100
        bonus = 10 if final_status == "PASSED" and iterations < 3 else 0
        penalty = (iterations - 1) * 5 if iterations > 1 else 0
        final_score = base_score + bonus - penalty

        results = {
            "run_id": run_id,
            "repo_url": repo_url,
            "status": final_status,
            "total_failures": total_failures,
            "total_fixes": total_fixes,
            "iterations": iterations,
            "score": {
                "base": base_score,
                "bonus": bonus,
                "penalty": penalty,
                "final": max(0, final_score)
            },
            "fixes": fixes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Ensure results directory exists
        os.makedirs("results", exist_ok=True)
        results_file = os.path.join("results", f"{run_id}.json")
        
        with open(results_file, "w") as f:
            json.dump(results, f, indent=4)
            
        return results

def report_result(attempt: int, success: bool, fix: str):
    agent = ReporterAgent()
    agent.build_results({
        "run_id": f"attempt_{attempt}",
        "success": success,
        "commits": 1 if success else 0,
        "total_time": 100
    })
