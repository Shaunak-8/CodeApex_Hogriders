import subprocess
import shutil
import os

def _make_failure(file, line, bug_type, msg, severity):
    return {
        "file": file,
        "line": line,
        "bug_type": bug_type,
        "error_message": msg,
        "severity": severity,
    }

def _run_tool(cmd: list, cwd: str) -> tuple:
    """Run a subprocess and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=120
        )
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        return -1, "", f"Tool not found: {cmd[0]}"
    except subprocess.TimeoutExpired:
        return -1, "", f"Tool timed out: {' '.join(cmd)}"

def run_flake8(path: str) -> list:
    if not shutil.which("flake8"):
        return []
    code, stdout, _ = _run_tool(["flake8", "--format=default", "."], cwd=path)
    failures = []
    for line in stdout.strip().splitlines():
        # Format: file:line:col: code message
        parts = line.split(":", 3)
        if len(parts) >= 4:
            failures.append(_make_failure(
                file=parts[0].strip(),
                line=int(parts[1].strip()) if parts[1].strip().isdigit() else 0,
                bug_type="LINTING",
                msg=parts[3].strip(),
                severity="low",
            ))
    return failures

def run_mypy(path: str) -> list:
    if not shutil.which("mypy"):
        return []
    code, stdout, _ = _run_tool(["mypy", "."], cwd=path)
    failures = []
    for line in stdout.strip().splitlines():
        # Format: file:line: error: message
        parts = line.split(":", 3)
        if len(parts) >= 4 and "error" in parts[2]:
            failures.append(_make_failure(
                file=parts[0].strip(),
                line=int(parts[1].strip()) if parts[1].strip().isdigit() else 0,
                bug_type="TYPE_ERROR",
                msg=parts[3].strip(),
                severity="medium",
            ))
    return failures

def run_pytest(path: str) -> list:
    if not shutil.which("pytest"):
        return []
    code, stdout, stderr = _run_tool(["pytest", "--tb=short", "-q"], cwd=path)
    failures = []
    if code != 0:
        for line in stdout.strip().splitlines():
            if "FAILED" in line:
                # Format: tests/test_foo.py::test_bar FAILED
                parts = line.split("::")
                file = parts[0].strip() if parts else "unknown"
                failures.append(_make_failure(
                    file=file,
                    line=0,
                    bug_type="LOGIC",
                    msg=line.strip(),
                    severity="high",
                ))
    return failures

def run_eslint(path: str) -> list:
    if not shutil.which("npx") or not os.path.exists(os.path.join(path, "package.json")):
        return []
    code, stdout, _ = _run_tool(["npx", "eslint", ".", "--format=compact"], cwd=path)
    failures = []
    for line in stdout.strip().splitlines():
        # Format: /path/file.js: line col, Error - message (rule)
        if ": line" in line:
            try:
                file_part, rest = line.split(": line ", 1)
                line_num = rest.split(",")[0].strip()
                msg = rest.split("-", 1)[-1].strip() if "-" in rest else rest
                failures.append(_make_failure(
                    file=os.path.basename(file_part.strip()),
                    line=int(line_num) if line_num.isdigit() else 0,
                    bug_type="SYNTAX",
                    msg=msg,
                    severity="low",
                ))
            except (ValueError, IndexError):
                pass
    return failures

def run_jest(path: str) -> list:
    if not shutil.which("npx") or not os.path.exists(os.path.join(path, "package.json")):
        return []
    code, stdout, stderr = _run_tool(["npx", "jest", "--no-coverage", "--json"], cwd=path)
    if code != 0:
        # Try to parse JSON output
        import json
        try:
            data = json.loads(stdout)
            failures = []
            for suite in data.get("testResults", []):
                for test in suite.get("testResults", []):
                    if test.get("status") == "failed":
                        failures.append(_make_failure(
                            file=os.path.basename(suite.get("testFilePath", "unknown")),
                            line=0,
                            bug_type="LOGIC",
                            msg=test.get("fullName", "Test failed"),
                            severity="high",
                        ))
            return failures
        except json.JSONDecodeError:
            pass
    return []
