import os
import httpx
from dotenv import load_dotenv

async def get_user_repositories():
    """Fetch repositories accessible by the configured GITHUB_TOKEN."""
    load_dotenv()
    token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        raise ValueError("GITHUB_TOKEN is missing in environment variables.")
        
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Fetching user's own repos and repos they collaborate on
            response = await client.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers)
            
            if response.status_code != 200:
                error_msg = f"GitHub API failed with status {response.status_code}: {response.text}"
                raise RuntimeError(error_msg)
            
            repos = response.json()
    except Exception as e:
        # Re-raise or propagate with context
        print(f"Error in get_user_repositories: {e}")
        raise
    
    # Format for frontend consumption
    return [
        {
            "id": repo.get("id"),
            "name": repo.get("name"),
            "full_name": repo.get("full_name"),
            "private": repo.get("private"),
            "html_url": repo.get("html_url"),
            "description": repo.get("description"),
            "language": repo.get("language"),
            "stars": repo.get("stargazers_count", 0),
            "updated_at": repo.get("updated_at")
        }
        for repo in repos
    ]
