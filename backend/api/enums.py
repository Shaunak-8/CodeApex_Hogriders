from enum import Enum

class VisibilityEnum(str, Enum):
    private = "private"
    public = "public"
    internal = "internal"

class TaskStatusEnum(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class RunStatusEnum(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"

class IterationStatusEnum(str, Enum):
    running = "running"
    testing = "testing"
    passed = "passed"
    failed = "failed"
    pass_ = "passed"  # Alias for compatibility
    fail = "failed"    # Alias for compatibility

class FixStatusEnum(str, Enum):
    applied = "applied"
    passed = "passed"
    failed = "failed"
    reverted = "reverted"

def normalize_status(status: str) -> str:
    """
    Robust normalization of status strings.
    - PASS, pass -> passed
    - FAIL, fail -> failed
    - Strip and lowercase others.
    """
    if not status:
        return "running"
    
    s = str(status).strip().lower()
    
    # Core mappings
    if s in ["pass", "passed", "success"]:
        return "passed"
    if s in ["fail", "failed", "failure"]:
        return "failed"
    
    return s

def sanitize_result(result: dict) -> dict:
    """
    Ensures agent results follow strict formatting:
    1. status is always lowercase and normalized.
    2. bug_type is always UPPERCASE.
    """
    if not isinstance(result, dict):
        return result
    
    res = result.copy() # Avoid mutating original
    
    if "status" in res:
        res["status"] = normalize_status(res["status"])
    
    if "bug_type" in res:
        res["bug_type"] = str(res["bug_type"]).upper()
        
    return res

def parse_iteration_status(value: str) -> IterationStatusEnum:
    """
    Safely parse an iteration status string into an IterationStatusEnum.
    Normalizes casing and whitespace, and supports member name lookups/aliases.
    """
    if not value:
        return IterationStatusEnum.running
    
    norm = normalize_status(value)
    
    try:
        return IterationStatusEnum(norm)
    except ValueError:
        # Fallback: Check member names (case-insensitive, including aliases)
        val_clean = value.strip().lower()
        for name, member in IterationStatusEnum.__members__.items():
            if name.lower() == val_clean or name.lower() == norm:
                return member
                
        valid_vals = list(set([e.value for e in IterationStatusEnum]))
        valid_names = list(IterationStatusEnum.__members__.keys())
        raise ValueError(
            f"'{value}' (normalized to '{norm}') is not a valid IterationStatusEnum. "
            f"Valid values: {valid_vals}, Valid names: {valid_names}"
        )
