import tools.linters as linters
import os

class AnalyzerAgent:
    def __init__(self):
        pass

    def run(self, repo_path: str):
        """Run all linters and tests, return grouped failures."""
        failures = []
        
        # 1. Syntax & Linting (Fastest)
        failures.extend(self._tag(linters.run_flake8(repo_path), "LINTING"))
        
        # 2. Type Checking
        failures.extend(self._tag(linters.run_mypy(repo_path), "TYPE_ERROR"))
        
        # 3. JS/TS Checks
        failures.extend(self._tag(linters.run_eslint(repo_path), "JS"))
        
        # 4. Logic & Tests (Execution required)
        failures.extend(self._tag(linters.run_pytest(repo_path), "LOGIC"))
        failures.extend(self._tag(linters.run_jest(repo_path), "JS"))
        
        # Deduplication and prioritization
        # If a line has a SyntaxError, we prioritize that over logic.
        return self._deduplicate(failures)

    def _tag(self, results, bug_type):
        for r in results:
            if "bug_type" not in r:
                r["bug_type"] = bug_type
        return results

    def _deduplicate(self, failures):
        seen = {}
        unique = []
        for f in failures:
            key = (f.get("file"), f.get("line"), f.get("error_message"))
            if key not in seen:
                seen[key] = True
                unique.append(f)
        return unique
