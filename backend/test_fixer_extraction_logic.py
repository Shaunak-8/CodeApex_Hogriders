import re

def extract_code(fixed_code: str) -> str:
    # 1. Try flexible regex (handles space before language tag and optional newlines)
    code_match = re.search(r"```[ \t]*(?:\w+)?[ \t]*\n?(.*?)\s*```", fixed_code, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()
    else:
        # 2. Fallback: Manual block extraction
        lines = fixed_code.splitlines()
        if len(lines) >= 2 and lines[0].startswith("```") and lines[-1].startswith("```"):
            return "\n".join(lines[1:-1]).strip()
        else:
            # 3. Last resort
            return fixed_code.replace("```", "").strip()

# Test cases
test_cases = [
    # Case 1: Standard
    ("```python\ndef add(a, b):\n    return a + b\n```", "def add(a, b):\n    return a + b"),
    # Case 2: Inline-ish (no newline before closing fence)
    ("```python\ndef add(a, b): return a + b```", "def add(a, b): return a + b"),
    # Case 3: Leading space in fence
    ("``` python\ndef add(a,b): pass\n```", "def add(a,b): pass"),
    # Case 4: No language tag
    ("```\ndef add(a,b): pass\n```", "def add(a,b): pass"),
    # Case 5: Text before/after (Regex should handle)
    ("Here is the fix:\n```python\ndef add(a,b): pass\n```\nHope it works!", "def add(a,b): pass"),
    # Case 6: Manual fallback (broken fence but starts/ends with ```)
    ("```python\nprint('hello')\n```", "print('hello')"),
]

for i, (input_str, expected) in enumerate(test_cases):
    result = extract_code(input_str)
    assert result == expected, f"Test {i+1} failed: Expected {repr(expected)}, got {repr(result)}"
    print(f"Test {i+1} passed!")

print("All fixer extraction tests passed!")
