import json
import os

class ReporterAgent:
    def build_results(self, run_data: dict) -> dict:
        total_time = run_data.get("total_time", 0)
        commits = run_data.get("commits", 0)
        
        score = 100
        if total_time < 300:
            score += 10
        if commits > 20:
            score -= ((commits - 20) * 2)
            
        run_id = run_data.get("run_id", "mock-123")
        results = {
            "run_id": run_id,
            "score": score,
            "data": run_data
        }
        
        os.makedirs("results", exist_ok=True)
        with open(os.path.join("results", f"{run_id}.json"), "w") as f:
            json.dump(results, f)
            
        return results
