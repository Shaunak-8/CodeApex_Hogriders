import os
import git

def clone_repo(url: str, path: str):
    if os.path.exists(path):
        if not os.path.exists(os.path.join(path, ".git")):
            # Path exists but is not a git repo
            if os.listdir(path):
                raise ValueError(
                    f"Target path exists and is not empty: path={path}, url={url}. "
                    "Please use an empty directory or remove existing files."
                )
            # Directory exists but is empty — safe to clone into
            return git.Repo.clone_from(url, path)
        # It's already a git repo
        return git.Repo(path)
    else:
        os.makedirs(path)
        return git.Repo.clone_from(url, path)

def create_branch(repo: git.Repo, branch_name: str = "HOGRIDERS_EKLAVYA_PURI_AI_Fix"):
    if branch_name in repo.heads:
        branch = repo.heads[branch_name]
        branch.checkout()
    else:
        branch = repo.create_head(branch_name)
        branch.checkout()
    return branch

def commit_and_push(repo: git.Repo, message: str, files: list) -> dict:
    """Commit and push files. Returns status dict. Raises on critical failure."""
    if not files:
        raise ValueError("No files provided to commit.")

    # Verify files exist
    for f in files:
        full_path = os.path.join(repo.working_dir, f)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {full_path}")

    full_message = f"[AI-AGENT] {message}"

    try:
        repo.index.add(files)
        commit = repo.index.commit(full_message)
    except Exception as e:
        # Attempt to reset index on failure
        try:
            repo.head.reset("HEAD", index=True, working_tree=False)
        except Exception:
            pass
        raise RuntimeError(f"Commit failed: {e}") from e

    try:
        origin = repo.remote(name="origin")
    except ValueError as e:
        raise RuntimeError(f"Remote 'origin' not found: {e}") from e

    try:
        branch_name = repo.active_branch.name
        origin.push(branch_name)
    except Exception as e:
        raise RuntimeError(f"Push failed for branch '{branch_name}': {e}") from e

    return {"status": "success", "commit": str(commit), "branch": branch_name}
