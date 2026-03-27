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
    passed = "passed"
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PASSED = "passed"

class IterationStatusEnum(str, Enum):
    running = "running"
    testing = "testing"
    pass_ = "pass"
    fail = "fail"
    passed = "passed"
    RUNNING = "running"
    TESTING = "testing"
    PASS = "pass"
    FAIL = "fail"
    PASSED = "passed"

class FixStatusEnum(str, Enum):
    applied = "applied"
    pass_ = "pass"
    fail = "fail"
    reverted = "reverted"
    APPLIED = "applied"
    PASS = "pass"
    FAIL = "fail"
    REVERTED = "reverted"
