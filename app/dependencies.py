"""FastAPI dependencies for authentication and database."""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.utils.security import decode_token
from app.services.firebase import verify_firebase_token

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from Firebase or JWT token.

    Tries Firebase token first, falls back to JWT.

    Args:
        credentials: HTTP Authorization credentials
        db: Database session

    Returns:
        Current user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    logger.info(f"Received token (first 50 chars): {token[:50]}..." if len(token) > 50 else f"Received token: {token}")
    user_id: Optional[str] = None
    firebase_uid: Optional[str] = None
    email: Optional[str] = None

    # Try Firebase token first
    firebase_claims = verify_firebase_token(token)
    logger.info(f"Firebase verification result: {'success' if firebase_claims else 'failed/skipped'}")
    if firebase_claims:
        firebase_uid = firebase_claims.get("uid")
        email = firebase_claims.get("email")

        # Look up user by firebase_uid or email
        if firebase_uid:
            result = await db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            )
            user = result.scalar_one_or_none()

            if user is None and email:
                # Try to find by email and link Firebase account
                result = await db.execute(
                    select(User).where(User.email == email)
                )
                user = result.scalar_one_or_none()
                if user:
                    # Link Firebase UID to existing user
                    user.firebase_uid = firebase_uid
                    user.is_verified = firebase_claims.get("email_verified", False)
                    await db.commit()
                    await db.refresh(user)

            if user is None:
                raise credentials_exception

            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive"
                )

            return user

    # Fall back to JWT token
    logger.info("Falling back to JWT token verification")
    try:
        payload = decode_token(token)
        logger.info(f"JWT decode successful, payload: {payload}")
        user_id = payload.get("sub")

        if user_id is None:
            logger.warning("JWT payload missing 'sub' claim")
            raise credentials_exception

    except JWTError as e:
        logger.error(f"JWT decode error: {type(e).__name__}: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {type(e).__name__}: {e}")
        raise credentials_exception

    # Get user from database by ID
    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user.

    Args:
        current_user: Current user from token

    Returns:
        Active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
