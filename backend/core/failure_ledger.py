import json
import copy

class FailureLedger:
    def __init__(self):
        self._ledger = {}

    def add_attempt(self, file: str, strategy: str, result: str):
        if file not in self._ledger:
            self._ledger[file] = []
        self._ledger[file].append({
            "strategy": strategy,
            "result": result
        })

    def was_tried(self, file: str, strategy: str) -> bool:
        if file not in self._ledger:
            return False
        for attempt in self._ledger[file]:
            if attempt["strategy"] == strategy:
                return True
        return False

    def get_ledger_for_prompt(self) -> str:
        return json.dumps(self._ledger, indent=2)

    def to_dict(self) -> dict:
        return copy.deepcopy(self._ledger)
