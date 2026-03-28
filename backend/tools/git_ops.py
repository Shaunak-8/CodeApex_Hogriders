import os
import git
import logging
import re
import time
import random
from config import GITHUB_TOKEN

logger = logging.getLogger(__name__)

def _get_authenticated_url(url: str, token: str = None) -> str:
    """Inject x-access-token into GitHub URL for secure authentication."""
    effective_token = token or GITHUB_TOKEN
    if not effective_token or not url.startswith("https://github.com/"):
        return url
    
    # Remove existing interactive auth if any
    clean_url = re.sub(r"https://[^@]+@github.com/", "https://github.com/", url)
    # Use the expert-recommended 'x-access-token' format
    return clean_url.replace("https://github.com/", f"https://x-access-token:{effective_token}@github.com/")

def generate_branch_name(team: str = "HOGRIDERS", leader: str = "AI") -> str:
    """Generate a clean, GitHub-safe branch name: TEAMNAME_LEADERNAME_AI_Fix_<TIMESTAMP>."""
    # Process team and leader names to be uppercase and alphanumeric
    clean_team = re.sub(r'[^A-Z0-9]', '_', team.upper()).strip('_')
    clean_leader = re.sub(r'[^A-Z0-9]', '_', leader.upper()).strip('_')
    
    timestamp = int(time.time())
    branch_name = f"{clean_team}_{clean_leader}_AI_Fix_{timestamp}"
    return branch_name

def validate_push_permissions(repo_url: str, token: str = None) -> bool:
    """Lightweight check for repo write permissions (currently relies on clone success + logic)."""
    # In a real enterprise setup, we might use a HEAD request to the GitHub API /repos/{owner}/{repo}
    # For now, we rely on the robustness of the push_with_retry logic.
    return True

def push_with_retry(repo: git.Repo, branch_name: str, token: str = None, max_retries: int = 3) -> dict:
    """Attempt a git push with exponential backoff and automatic remote reconfiguration."""
    origin = repo.remote(name="origin")
    original_url = origin.url
    
    # Ensure current branch is checked out
    current_head = repo.active_branch.name
    logger.info(f"[DEBUG] Current HEAD: {current_head} | Target: {branch_name}")

    for attempt in range(1, max_retries + 1):
        try:
            # 1. Reconfigure remote with current token (or fallback on retry 2/3)
            current_token = token if attempt == 1 else GITHUB_TOKEN
            auth_url = _get_authenticated_url(original_url, current_token)
            
            # Mask token for logging
            masked_url = re.sub(r"https://[^@]+@", "https://***@", auth_url)
            logger.info(f"[LOG] Attempt {attempt}/{max_retries} | Target Branch: {branch_name}")
            logger.info(f"[LOG] Command: git push --force origin HEAD:{branch_name}")
            logger.info(f"[LOG] Remote URL: {masked_url}")

            repo.git.remote('set-url', 'origin', auth_url)
            
            # 2. Execute push
            # Use refspec to ensure we push the current HEAD to the target branch name
            push_info = origin.push(refspec=f'HEAD:{branch_name}', force=True)
            
            for info in push_info:
                if info.flags & git.PushInfo.ERROR:
                    raise RuntimeError(f"Git push error flag: {info.summary}")
            
            logger.info(f"[SUCCESS] Pushed fixes to {branch_name} on attempt {attempt}")
            
            # Cleanup: Revert to original URL
            repo.git.remote('set-url', 'origin', original_url)
            return {"status": "success", "branch": branch_name}

        except Exception as e:
            err_msg = str(e)
            logger.error(f"[FAILURE] Attempt {attempt} failed: {err_msg}")
            
            if attempt < max_retries:
                # Jittered delay
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                logger.info(f"[RETRY] Waiting {wait_time:.2f}s before next attempt...")
                time.sleep(wait_time)
                
                # On retry, try to regenerate branch suffix if it's a naming conflict (optional)
                if "already exists" in err_msg:
                    branch_name += f"_R{attempt}"
            else:
                # Final failure: Cleanup and report
                try:
                    repo.git.remote('set-url', 'origin', original_url)
                except:
                    pass
                
                status = "auth_forbidden" if "403" in err_msg else "failed"
                return {"status": status, "error": err_msg, "branch": branch_name}

def clone_repo(url: str, path: str, token: str = None):
    auth_url = _get_authenticated_url(url, token)
    if os.path.exists(path):
        if not os.path.exists(os.path.join(path, ".git")):
            if os.listdir(path):
                raise ValueError(f"Target path exists and is not empty: path={path}")
            return git.Repo.clone_from(auth_url, path)
        return git.Repo(path)
    else:
        os.makedirs(path, exist_ok=True)
        return git.Repo.clone_from(auth_url, path)

def create_branch(repo: git.Repo, branch_name: str):
    if branch_name in repo.heads:
        branch = repo.heads[branch_name]
        branch.checkout()
    else:
        branch = repo.create_head(branch_name)
        branch.checkout()
    return branch

def commit_and_push_all(repo_path: str, message: str, branch_name: str = None, token: str = None) -> dict:
    """High-level entry point for committing and pushing fixes."""
    try:
        repo = git.Repo(repo_path)
        
        # 1. Branch Generation/Checkout
        if not branch_name:
            branch_name = generate_branch_name()
        
        create_branch(repo, branch_name)
        
        # 2. Stage and Commit
        repo.git.add(A=True)
        if not repo.is_dirty(untracked_files=True):
            logger.info("Nothing to commit.")
            return {"status": "nothing_to_commit", "branch": branch_name}
        
        full_message = f"[AI-AGENT] {message}"
        commit = repo.index.commit(full_message)
        logger.info(f"Committed changes: {commit}")
        
        # 3. Push with Retry logic
        push_res = push_with_retry(repo, branch_name, token=token)
        
        if push_res["status"] == "success":
            return {"status": "success", "commit": str(commit), "branch": branch_name}
        else:
            return {
                "status": push_res["status"], 
                "commit": str(commit), 
                "branch": branch_name, 
                "error": push_res.get("error")
            }

    except Exception as e:
        logger.exception(f"Unexpected error in commit_and_push_all: {e}")
        return {"status": "failed", "error": str(e)}
