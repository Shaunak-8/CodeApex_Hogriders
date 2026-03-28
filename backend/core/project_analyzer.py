import os
import ast
import re
from typing import List, Dict

class ProjectAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.nodes = []
        self.edges = []
        self.ignored_dirs = {".git", "node_modules", "__pycache__", "venv", "dist", "build", "workspaces", "results"}
        self.supported_exts = {".py", ".js", ".jsx", ".ts", ".tsx", ".c", ".cpp", ".h", ".hpp"}

    def _get_files(self) -> List[str]:
        all_files = []
        for root, dirs, files in os.walk(self.repo_path):
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs]
            for file in files:
                if any(file.endswith(ext) for ext in self.supported_exts):
                    rel_path = os.path.relpath(os.path.join(root, file), self.repo_path)
                    all_files.append(rel_path)
        return all_files

    def _extract_imports(self, rel_path: str) -> List[str]:
        full_path = os.path.join(self.repo_path, rel_path)
        imports = []
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if rel_path.endswith(".py"):
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports.append(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imports.append(node.module)
            
            elif rel_path.endswith((".js", ".jsx", ".ts", ".tsx")):
                # Regex for JS/TS imports
                matches = re.findall(r'import\s+.*\s+from\s+[\'"](.+)[\'"]', content)
                matches += re.findall(r'require\([\'"](.+)[\'"]\)', content)
                for m in matches:
                    if m.startswith("."):
                        # Resolve relative path simple logic
                        imports.append(m)
                    else:
                        imports.append(m)
            
            elif rel_path.endswith((".c", ".cpp", ".h", ".hpp")):
                # Regex for C++ includes
                matches = re.findall(r'#include\s+["<](.+)[">]', content)
                imports.extend(matches)

        except Exception:
            pass
        return imports

    def analyze(self) -> Dict:
        files = self._get_files()
        file_set = set(files)
        
        # Map basenames for easier matching
        basename_map = {}
        for f in files:
            bn = os.path.splitext(os.path.basename(f))[0]
            if bn not in basename_map:
                basename_map[bn] = []
            basename_map[bn].append(f)

        nodes = []
        edges = []
        counts = {f: {"in": 0, "out": 0, "size": os.path.getsize(os.path.join(self.repo_path, f))} for f in files}

        for f in files:
            imports = self._extract_imports(f)
            for imp in imports:
                # Try to resolve import to a file in our set
                target = None
                
                # 1. Direct rel path match
                if imp in file_set:
                    target = imp
                else:
                    # 2. Try matching by submodule path (e.g., api.db -> api/db.py)
                    parts = imp.split(".")
                    # Try suffixes
                    for suffix in [".py", ".js", ".js", ".cpp", ".c", ".h"]:
                        candidate = "/".join(parts) + suffix
                        # Try to find a file that ends with this candidate
                        for f_path in file_set:
                            if f_path.endswith(candidate):
                                target = f_path
                                break
                        if target: break
                    
                    if not target:
                        # 3. Last fallback: Basename match
                        bn = parts[-1]
                        if bn in basename_map:
                            target = basename_map[bn][0]
                
                if target and target != f:
                    edges.append({"source": f, "target": target})
                    counts[f]["out"] += 1
                    counts[target]["in"] += 1

        for f in files:
            # Risk Score calculation
            # High in-degree = Core (lower risk if stable, but high impact)
            # High out-degree = Complex (higher risk)
            # Large size = Higher risk
            score = (counts[f]["out"] * 0.1) + (counts[f]["in"] * 0.05) + (min(counts[f]["size"] / 10000, 0.5))
            score = round(min(score, 1.0), 2)
            
            nodes.append({
                "id": f,
                "type": "file",
                "risk_score": score
            })

        return {"nodes": nodes, "edges": edges}
