import os
import httpx
from dotenv import load_dotenv

async def get_user_repositories():
    """Fetch repositories accessible by the configured GITHUB_TOKEN."""
    load_dotenv()
    token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        return []
        
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        # Fetching user's own repos and repos they collaborate on
        response = await client.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers)
        
        if response.status_code != 200:
            return []
            
        repos = response.json()
        
        # Format for frontend consumption
        return [
            {
                "id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "private": repo["private"],
                "html_url": repo["html_url"],
                "description": repo["description"],
                "language": repo["language"],
                "updated_at": repo["updated_at"]
            }
            for repo in repos
        ]
