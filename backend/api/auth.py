from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from supabase import create_client, Client

logger = logging.getLogger(__name__)

security = HTTPBearer()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def verify_token(request: Request):
    """Verify the Supabase JWT using the Supabase client."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        request.state.user_id = user.id
        request.state.email = user.email
        return {"sub": user.id, "email": user.email}
    except Exception as e:
        logger.error("JWT Verification failed via Supabase. Error: %s", e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_user_id(request: Request) -> str:
    """Helper to extract user_id from request state after middleware."""
    return getattr(request.state, "user_id", None)
