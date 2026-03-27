def calculate(fix_json: dict) -> dict:
    bug_type = fix_json.get("bug_type", "LOGIC")
    lines_changed = fix_json.get("lines_changed", 0)
    touches_imports = fix_json.get("touches_imports", False)
    blast_radius = fix_json.get("blast_radius", 0)

    base_score = 65
    if bug_type == "LINTING":
        base_score = 95
    elif bug_type == "SYNTAX":
        base_score = 88
    elif bug_type == "TYPE_ERROR":
        base_score = 80
    elif bug_type == "IMPORT":
        base_score = 85
    elif bug_type == "LOGIC":
        base_score = 65

    if lines_changed > 10:
        base_score -= 10
    if touches_imports:
        base_score -= 8
    if blast_radius > 3:
        base_score -= 5

    score = max(0, min(100, base_score))
    
    return {
        "score": score,
        "needs_human_review": score < 60
    }
