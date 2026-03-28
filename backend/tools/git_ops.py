import os
import subprocess
import logging
import re
import time
import random
from typing import Optional
from config import GITHUB_TOKEN

logger = logging.getLogger(__name__)

GIT_TIMEOUT = 120  # seconds

def run_git_command(repo_path: str, cmd: list, mask_token: str = None, timeout: int = GIT_TIMEOUT) -> tuple:
    """Helper to run git subprocesses with timeout and masked logging."""
    log_cmd = " ".join(cmd)
    if mask_token:
        log_cmd = log_cmd.replace(mask_token, "****")
    
    logger.debug(f"[GIT EXEC] {log_cmd}")
    
    # Sanitized environment that blocks macOS Keychain
    sanitized_env = os.environ.copy()
    sanitized_env["GIT_CONFIG_NOSYSTEM"] = "1"
    sanitized_env["GIT_TERMINAL_PROMPT"] = "0"
    sanitized_env["GIT_ASKPASS"] = ""
    
    try:
        res = subprocess.run(cmd, cwd=repo_path, capture_output=True, text=True, check=True, env=sanitized_env, timeout=timeout)
        return True, res.stdout, res.stderr
    except subprocess.TimeoutExpired:
        logger.warning(f"[GIT TIMEOUT] CMD={log_cmd} | timeout={timeout}s")
        return False, "", f"Command timed out after {timeout}s"
    except subprocess.CalledProcessError as e:
        logger.warning(f"[GIT ERROR] CMD={log_cmd} | EXIT={e.returncode} | STDERR={e.stderr.strip()}")
        return False, e.stdout, e.stderr


def generate_branch_name(team: str = "HOGRIDERS", leader: str = "AI") -> str:
    """Requirement 4: Generate clean, uppercase branch name securely."""
    clean_team = re.sub(r'[^A-Z0-9]', '_', team.upper()).strip('_') or "TEAM"
    clean_leader = re.sub(r'[^A-Z0-9]', '_', leader.upper()).strip('_') or "LEADER"
    timestamp = int(time.time())
    return f"{clean_team}_{clean_leader}_AI_FIX_{timestamp}"

def prepare_repo(repo_path: str):
    """
    Requirement 3: Disable Credential Caching.
    Ensures safe, clean state before pushing.
    """
    logger.info("[V3] Preparing repository and unsetting credentials...")
    
    # Scope credential.helper override to this repo only (don't mutate global config)
    run_git_command(repo_path, ["git", "config", "--local", "credential.helper", ""])
    
    logger.info("[V3] Credential helpers disabled.")

def commit_changes(repo_path: str, message: str):
    """Requirement 5: Implement clean Commit Logic.
    Returns: True on successful commit, None if tree is clean, False on error.
    """
    logger.info("[V3] Staging and committing changes...")
    
    # Stage all
    add_ok, _, add_err = run_git_command(repo_path, ["git", "add", "."])
    if not add_ok:
        logger.error(f"[V3] git add failed: {add_err}")
        return False
    
    # Check if dirty
    status_ok, stdout, status_err = run_git_command(repo_path, ["git", "status", "--porcelain"])
    if not status_ok:
        logger.error(f"[V3] git status failed: {status_err}")
        return False
    if not stdout.strip():
        logger.info("[V3] Nothing to commit. Tree is clean.")
        return None
        
    full_message = f"[AI-AGENT] Fix applied: {message}"
    commit_ok, _, commit_err = run_git_command(repo_path, ["git", "commit", "-m", full_message])
    
    if commit_ok:
        logger.info(f"[V3] Committed changes successfully. MSG: {full_message}")
        return True
    else:
        logger.error(f"[V3] Commit failed: {commit_err}")
        return False

def classify_error(stderr: str) -> str:
    """Requirement 8: Error Classification."""
    stderr_lower = stderr.lower()
    if "403" in stderr_lower: return "AUTH_ERROR (Forbidden)"
    if "401" in stderr_lower: return "INVALID_TOKEN (Unauthorized)"
    if "404" in stderr_lower: return "REPO_NOT_FOUND"
    
    network_indicators = ["network", "connection", "resolve host", "timed out", "unreachable"]
    if any(ind in stderr_lower for ind in network_indicators):
        return "NETWORK_ERROR"
        
    return "UNKNOWN_GIT_ERROR"

def push_changes(repo_path: str, token: str, branch_name: str) -> dict:
    """
    Requirement 1, 2, 4, 6, 7: Core Fault-Tolerant Push Engine.
    100% Subprocess. Direct URL forcing. 3-stage retries.
    CRITICAL: ALWAYS uses GITHUB_TOKEN from config for pushing.
    The 'token' param from the orchestrator may be a Supabase OAuth token
    (gho_...) which does NOT have push permissions.
    """
    # Use GITHUB_TOKEN if set, otherwise fall back to the passed-in token
    token = GITHUB_TOKEN or token
    if not token:
        logger.error("[V3] No GITHUB_TOKEN configured and no token provided. Cannot push.")
        return {"status": "failed", "branch": branch_name, "attempts": 0, "error_type": "NO_TOKEN", "error": "No GitHub token available"}
    
    # Extract original URL safely
    success, origin_url, err = run_git_command(repo_path, ["git", "remote", "get-url", "origin"])
    origin_url = origin_url.strip()
    
    if not success or not origin_url:
        logger.error("[V3] Could not determine origin URL. Cannot construct Auth URL.")
        return {"status": "failed", "branch": branch_name, "attempts": 0, "error_type": "LOCAL_ERROR", "error": "No origin URL"}

    # Requirement 2: Clean and Construct Auth URL
    clean_url = re.sub(r"https://[^@]+@github.com/", "https://github.com/", origin_url)
    if not clean_url.endswith(".git") and "github.com" in clean_url:
        clean_url = clean_url.rstrip('/') + ".git"
    
    auth_url = clean_url.replace("https://github.com/", f"https://x-access-token:{token}@github.com/")
    masked_url = re.sub(r"https://[^@]+@", "https://***@", auth_url)

    for attempt in range(1, 4):
        logger.info(f"--- [V3] Git Push Attempt {attempt}/3 ---")
        
        # Requirement 4: Ensure Branch Creation
        if attempt > 1:
            branch_name = f"{branch_name}_RETRY_{attempt}"
            
        logger.info(f"[V3] Checking out branch: {branch_name}")
        run_git_command(repo_path, ["git", "checkout", "-b", branch_name])

        # Requirement 6: Mandatory Logging
        logger.info(f"[V3] PUSHING TO: {masked_url}")
        
        cmd = ["git", "push", "--force", auth_url, f"HEAD:{branch_name}"]
        success, stdout, stderr = run_git_command(repo_path, cmd, mask_token=token)
        
        if success:
            logger.info(f"[V3] [SUCCESS] Direct push successful on attempt {attempt}")
            return {"status": "success", "branch": branch_name, "attempts": attempt}
            
        else:
            error_type = classify_error(stderr)
            logger.error(f"[V3] [FAILURE] Attempt {attempt} failed: {error_type} | Output: {stderr}")
            
            if attempt < 3:
                # Requirement 7: Adaptive Reset before retry
                logger.info("[V3] [RECOVERY] Executing credential purge and sleeping...")
                prepare_repo(repo_path)
                time.sleep((2 ** attempt) + random.uniform(0.1, 0.5))
            else:
                return {
                    "status": "failed",
                    "branch": branch_name,
                    "attempts": attempt,
                    "error_type": error_type,
                    "error": stderr
                }

def commit_and_push_all(repo_path: str, message: str, branch_name: str = None, token: str = None) -> dict:
    """V3 Orchestration Entry Point. ALWAYS uses GITHUB_TOKEN for push."""
    try:
        logger.info("[V3] Initiating Senior DevOps Push Pipeline...")
        # Use GITHUB_TOKEN if set, otherwise fall back to passed-in token
        token = GITHUB_TOKEN or token
        if not token:
            return {"status": "failed", "branch": branch_name or "unknown", "attempts": 0, "error_type": "NO_TOKEN", "error": "No GitHub token available"}
        
        if not branch_name:
            branch_name = generate_branch_name()
            
        prepare_repo(repo_path)
        commit_result = commit_changes(repo_path, message)
        
        if commit_result is False:
            return {"status": "failed", "branch": branch_name, "attempts": 0, "error_type": "COMMIT_ERROR", "error": "Local git commit failed"}
        
        return push_changes(repo_path, token, branch_name)

    except Exception as e:
        logger.exception(f"[V3] CRITICAL_SYSTEM_ERROR in push pipeline: {e}")
        return {
            "status": "failed",
            "branch": branch_name or "unknown",
            "attempts": 0,
            "error_type": "CRITICAL_SYSTEM_ERROR",
            "error": str(e)
        }

def clone_repo(url: str, path: str, token: str = None):
    """V3 DevOps Cloner: Guaranteed valid clone with auth."""
    effective_token = GITHUB_TOKEN or token
    if not effective_token:
        logger.error("[V3] No token available for clone.")
        return None
    clean_url = re.sub(r"https://[^@]+@github.com/", "https://github.com/", url)
    if not clean_url.endswith(".git") and "github.com" in clean_url:
        clean_url = clean_url.rstrip('/') + ".git"
    auth_url = clean_url.replace("https://github.com/", f"https://x-access-token:{effective_token}@github.com/")

    # Sanitized env to block osxkeychain
    sanitized_env = os.environ.copy()
    sanitized_env["GIT_CONFIG_NOSYSTEM"] = "1"
    sanitized_env["GIT_TERMINAL_PROMPT"] = "0"
    sanitized_env["GIT_ASKPASS"] = ""

    if os.path.exists(path):
        if not os.path.exists(os.path.join(path, ".git")):
            if os.listdir(path): return None
            subprocess.run(["git", "clone", auth_url, path], check=True, env=sanitized_env, timeout=GIT_TIMEOUT)
            return True
        return True
    else:
        os.makedirs(path, exist_ok=True)
        subprocess.run(["git", "clone", auth_url, path], check=True, env=sanitized_env, timeout=GIT_TIMEOUT)
        return True
