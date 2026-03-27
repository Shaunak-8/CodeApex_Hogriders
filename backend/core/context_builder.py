import os
import ast

class ContextBuilder:
    def __init__(self, max_tokens: int = 12000):
        self.max_tokens = max_tokens

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count using a simple heuristic (chars / 4)."""
        return len(text) // 4

    def _read_file_safe(self, path: str) -> str:
        """Read file contents safely, return empty string on failure."""
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""

    def _extract_imports(self, source: str) -> list:
        """Extract import module names from Python source using AST."""
        imports = []
        try:
            tree = ast.parse(source)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module.split(".")[0])
        except SyntaxError:
            pass
        return imports

    def build(self, primary_file: str, repo_path: str) -> dict:
        primary_path = os.path.join(repo_path, primary_file)
        primary_content = self._read_file_safe(primary_path)

        # Extract imports and read their contents (up to 2 levels)
        import_modules = self._extract_imports(primary_content)
        imports = []
        seen = set()
        for mod in import_modules:
            if mod in seen:
                continue
            seen.add(mod)
            # Try common file patterns
            for candidate in [f"{mod}.py", os.path.join(mod, "__init__.py")]:
                mod_path = os.path.join(repo_path, candidate)
                if os.path.exists(mod_path):
                    content = self._read_file_safe(mod_path)
                    imports.append({"path": candidate, "content": content})
                    # Level 2: extract sub-imports
                    sub_imports = self._extract_imports(content)
                    for sub in sub_imports:
                        if sub in seen:
                            continue
                        seen.add(sub)
                        for sub_candidate in [f"{sub}.py", os.path.join(sub, "__init__.py")]:
                            sub_path = os.path.join(repo_path, sub_candidate)
                            if os.path.exists(sub_path):
                                sub_content = self._read_file_safe(sub_path)
                                imports.append({"path": sub_candidate, "content": sub_content})
                                break
                    break

        # Find test file
        test_file = ""
        test_candidates = [
            primary_file.replace(".py", "_test.py"),
            f"test_{os.path.basename(primary_file)}",
            os.path.join("tests", f"test_{os.path.basename(primary_file)}"),
        ]
        for tc in test_candidates:
            tc_path = os.path.join(repo_path, tc)
            if os.path.exists(tc_path):
                test_file = self._read_file_safe(tc_path)
                break

        # Compute token count and cap at max_tokens
        all_text = primary_content + test_file
        for imp in imports:
            all_text += imp["content"]
        token_count = min(self._estimate_tokens(all_text), self.max_tokens)

        return {
            "primary": primary_content,
            "imports": imports,
            "test_file": test_file,
            "token_count": token_count,
        }
