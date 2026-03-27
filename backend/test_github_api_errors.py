import os
import asyncio
from unittest.mock import patch, AsyncMock
from tools.github_api import get_user_repositories

async def test_github_api_errors():
    # 1. Test missing token
    with patch.dict(os.environ, {"GITHUB_TOKEN": ""}):
        # Need to ensure load_dotenv doesn't overwrite our empty token if it's already in .env
        with patch("tools.github_api.load_dotenv"):
            try:
                await get_user_repositories()
                print("❌ Test 1 failed: Should have raised ValueError for missing token")
            except ValueError as e:
                print(f"✅ Test 1 passed: Raised expected ValueError: {e}")

    # 2. Test API failure (e.g., 401 Unauthorized)
    with patch.dict(os.environ, {"GITHUB_TOKEN": "fake_token"}):
        with patch("tools.github_api.load_dotenv"):
            mock_response = AsyncMock()
            mock_response.status_code = 401
            mock_response.text = "Unauthorized"
            
            with patch("httpx.AsyncClient.get", return_value=mock_response):
                try:
                    await get_user_repositories()
                    print("❌ Test 2 failed: Should have raised RuntimeError for API failure")
                except RuntimeError as e:
                    print(f"✅ Test 2 passed: Raised expected RuntimeError: {e}")

if __name__ == "__main__":
    asyncio.run(test_github_api_errors())
