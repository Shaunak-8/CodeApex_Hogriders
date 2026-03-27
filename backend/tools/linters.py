def _mock_failure(file, line, bug_type, msg, severity):
    return {
        "file": file,
        "line": line,
        "bug_type": bug_type,
        "error_message": msg,
        "severity": severity
    }

def run_flake8(path: str) -> list:
    return [_mock_failure("main.py", 10, "LINTING", "E501 line too long", "low")]

def run_mypy(path: str) -> list:
    return [_mock_failure("main.py", 12, "TYPE_ERROR", "Incompatible types in assignment", "medium")]

def run_pytest(path: str) -> list:
    return [_mock_failure("test_main.py", 5, "LOGIC", "AssertionError: expected 1 got 2", "high")]

def run_eslint(path: str) -> list:
    return [_mock_failure("App.jsx", 3, "SYNTAX", "Missing semicolon", "low")]

def run_jest(path: str) -> list:
    return [_mock_failure("App.test.jsx", 8, "LOGIC", "Expected component to render", "high")]
