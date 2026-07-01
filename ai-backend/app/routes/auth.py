"""
MAD Gambit AI Backend — Auth Routes (SIWE)
"""

import time
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from siwe import SiweMessage
import jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger("madgambit.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()

# In-memory store for nonces (use Redis in prod)
# Mapping of nonce -> timestamp generated
_nonce_store: dict[str, float] = {}

class NonceResponse(BaseModel):
    nonce: str

class VerifyRequest(BaseModel):
    message: str
    signature: str

class VerifyResponse(BaseModel):
    token: str
    wallet_address: str

def generate_nonce() -> str:
    # A random string acting as a nonce
    nonce = uuid.uuid4().hex
    _nonce_store[nonce] = time.monotonic()
    return nonce

@router.get("/nonce", response_model=NonceResponse)
async def get_nonce():
    """Generates a secure random nonce for the SIWE challenge."""
    nonce = generate_nonce()
    # Cleanup old nonces
    now = time.monotonic()
    expired = [k for k, v in _nonce_store.items() if now - v > 300] # 5 min TTL
    for k in expired:
        _nonce_store.pop(k, None)
    return NonceResponse(nonce=nonce)


@router.post("/verify", response_model=VerifyResponse)
async def verify_signature(req: VerifyRequest, db: Session = Depends(get_db)):
    """Verifies a SIWE message and signature, issuing a JWT."""
    try:
        # Parse the SIWE message
        siwe_message = SiweMessage(message=req.message)
        
        # Verify the signature
        siwe_message.verify(req.signature)
        
        # Check nonce
        nonce = siwe_message.nonce
        if nonce not in _nonce_store:
            raise HTTPException(status_code=400, detail="Invalid or expired nonce.")
        
        # Remove nonce to prevent replay
        _nonce_store.pop(nonce)
        
        # Query the users table by wallet_address (case-insensitive normalized)
        wallet_address = siwe_message.address.lower()
        user = db.query(User).filter(User.wallet_address == wallet_address).first()
        if not user:
            # Create user if does not exist
            user = User(wallet_address=wallet_address)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Issue JWT
        payload = {
            "sub": str(user.id),
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600 * 24 * 7 # 7 days
        }
        token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
        
        logger.info("Wallet authenticated successfully", extra={"wallet": wallet_address})
        
        return VerifyResponse(token=token, wallet_address=user.wallet_address)
        
    except ValueError as e:
        logger.error("SIWE validation error", extra={"error": str(e)})
        raise HTTPException(status_code=400, detail="Invalid SIWE message or signature.")
    except Exception as e:
        logger.error("Auth verify failed", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Authentication failed.")

# Security dependency to verify bearer token and retrieve user
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim.")
        
        # Query user by uuid
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found.")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

@router.post("/test-write")
async def test_write(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates the user's xp field in the database by adding 1."""
    try:
        current_user.xp += 1
        db.commit()
        db.refresh(current_user)
        return current_user.to_dict()
    except Exception as e:
        db.rollback()
        logger.error("Failed to update user XP", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Database write failed.")

