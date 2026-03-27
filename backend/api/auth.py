from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import SUPABASE_JWT_SECRET

security = HTTPBearer()

async def verify_token(request: Request):
    """Extract and verify the Supabase JWT from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        request.state.user_id = payload.get("sub")
        request.state.email = payload.get("email", "")
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_user_id(request: Request) -> str:
    """Helper to extract user_id from request state after middleware."""
    return getattr(request.state, "user_id", None)
