import os
import git

def clone_repo(url: str, path: str):
    if not os.path.exists(path):
        os.makedirs(path)
    if not os.path.exists(os.path.join(path, ".git")):
        return git.Repo.clone_from(url, path)
    return git.Repo(path)

def create_branch(repo: git.Repo, branch_name: str = "HOGRIDERS_EKLAVYA_PURI_AI_Fix"):
    if branch_name in repo.heads:
        branch = repo.heads[branch_name]
        branch.checkout()
    else:
        branch = repo.create_head(branch_name)
        branch.checkout()
    return branch

def commit_and_push(repo: git.Repo, message: str, files: list):
    full_message = f"[AI-AGENT] {message}"
    repo.index.add(files)
    repo.index.commit(full_message)
    origin = repo.remote(name='origin')
    origin.push(repo.active_branch.name)
