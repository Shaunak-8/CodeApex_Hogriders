import re
from config import GITHUB_TOKEN

def _get_authenticated_url(url: str, token: str = None) -> str:
    effective_token = token or GITHUB_TOKEN
    if not effective_token or not url.startswith("https://github.com/"):
        return url
    clean_url = re.sub(r"https://[^@]+@github.com/", "https://github.com/", url)
    return clean_url.replace("https://github.com/", f"https://x-access-token:{effective_token}@github.com/")

def test_normalization(url, token):
    auth_url = _get_authenticated_url(url, token)
    print(f"Before normalization: {auth_url}")
    if not auth_url.endswith(".git") and "https://github.com" in auth_url:
         auth_url = auth_url.rstrip('/') + ".git"
    print(f"After normalization:  {auth_url}")
    return auth_url

# Test cases
token = "test_token"
urls = [
    "https://github.com/Eklavvyaaaaa/test5",
    "https://github.com/Eklavvyaaaaa/test5/",
    "https://user:pass@github.com/Eklavvyaaaaa/test5"
]

for u in urls:
    print(f"\nTesting URL: {u}")
    test_normalization(u, token)
