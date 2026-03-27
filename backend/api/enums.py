from enum import Enum

class VisibilityEnum(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    INTERNAL = "internal"

class TaskStatusEnum(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class RunStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PASSED = "passed" # Support both PASSED and passed by normalizing to passed

class IterationStatusEnum(str, Enum):
    RUNNING = "running"
    TESTING = "testing"
    PASS = "pass"
    FAIL = "fail"
    PASSED = "passed"

class FixStatusEnum(str, Enum):
    APPLIED = "applied"
    PASS = "pass"
    FAIL = "fail"
    REVERTED = "reverted"
