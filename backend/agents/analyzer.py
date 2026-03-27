import tools.linters as linters
import re
from typing import Optional
from agents.schema import FailureRecord

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

def parse_failure(raw_output: str) -> Optional[FailureRecord]:
    file_name = "unknown_file.py"
    line_num = 0
    error_type = "LOGIC"
    message = "Unknown error"
    test_name = None

    # Extract file and line
    file_match = re.search(r'([a-zA-Z0-9_/\\]+\.py):(\d+)', raw_output)
    if file_match:
        file_name = file_match.group(1)
        line_num = int(file_match.group(2))
        
    # Extract test name
    test_match = re.search(r'::(test_[a-zA-Z0-9_]+)', raw_output)
    if test_match:
        test_name = test_match.group(1)
        
    # Classify error
    if "TypeError" in raw_output:
        error_type = "TYPE_ERROR"
    elif "SyntaxError" in raw_output:
        error_type = "SYNTAX"
    elif "AssertionError" in raw_output:
        error_type = "LOGIC"
        
    # Grab last non-empty line as message
    lines = [line.strip() for line in raw_output.strip().split('\n') if line.strip()]
    if lines:
        message = lines[-1]

    return FailureRecord(
        file=file_name,
        line=line_num,
        error_type=error_type,
        message=message,
        test_name=test_name
    )
