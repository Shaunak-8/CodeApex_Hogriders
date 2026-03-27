from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class FailureRecord:
    file: str
    line: int
    error_type: str
    message: str
    test_name: Optional[str] = None

    def to_dict(self):
        return asdict(self)
