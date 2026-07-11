from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_utils import verify_clerk_token

from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)
clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)


async def verify_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = verify_clerk_token(
            token=credentials.credentials,
            jwt_key=settings.CLERK_JWT_KEY,
            authorized_parties=[settings.CLERK_AUTHORIZED_PARTIES],
        )
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
