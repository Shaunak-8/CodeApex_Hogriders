class MemoryAgent:
    def __init__(self):
        # failure_key -> list of attempted fixes
        self.history = {}

    def get_context(self, file: str, line: int):
        key = f"{file}:{line}"
        return self.history.get(key, [])

    def record(self, file: str, line: int, fix: str, result: str):
        key = f"{file}:{line}"
        if key not in self.history:
            self.history[key] = []
        self.history[key].append({
            "fix": fix,
            "result": result
        })

    def clear(self):
        self.history = {}
