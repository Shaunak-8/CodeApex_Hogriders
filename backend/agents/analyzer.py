import tools.linters as linters

class AnalyzerAgent:
    def run(self, repo_path: str):
        failures = []
        failures.extend(linters.run_flake8(repo_path))
        failures.extend(linters.run_mypy(repo_path))
        failures.extend(linters.run_pytest(repo_path))
        failures.extend(linters.run_eslint(repo_path))
        failures.extend(linters.run_jest(repo_path))
        
        grouped = {}
        for f in failures:
            key = f"{f['file']}_{f['bug_type']}"
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(f)
            
        return [g[0] for g in grouped.values()]
