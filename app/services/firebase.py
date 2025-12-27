"""Firebase Authentication service."""
import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings


# Firebase app instance
_firebase_app: Optional[firebase_admin.App] = None


def init_firebase() -> Optional[firebase_admin.App]:
    """
    Initialize Firebase Admin SDK.

    Returns:
        Firebase app instance or None if credentials not found
    """
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    cred_path = settings.firebase_credentials_path

    # Check if credentials file exists
    if not os.path.exists(cred_path):
        print(f"Warning: Firebase credentials file not found at {cred_path}")
        print("Firebase authentication will not be available.")
        return None

    try:
        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully")
        return _firebase_app
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None


def get_firebase_app() -> Optional[firebase_admin.App]:
    """Get the Firebase app instance."""
    global _firebase_app
    return _firebase_app


def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token.

    Args:
        id_token: The Firebase ID token from the client

    Returns:
        Decoded token claims if valid, None otherwise
    """
    if _firebase_app is None:
        return None

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.InvalidIdTokenError:
        return None
    except auth.ExpiredIdTokenError:
        return None
    except auth.RevokedIdTokenError:
        return None
    except Exception:
        return None


def get_firebase_user(uid: str) -> Optional[auth.UserRecord]:
    """
    Get Firebase user by UID.

    Args:
        uid: Firebase user UID

    Returns:
        UserRecord if found, None otherwise
    """
    if _firebase_app is None:
        return None

    try:
        return auth.get_user(uid)
    except auth.UserNotFoundError:
        return None
    except Exception:
        return None


def get_firebase_user_by_email(email: str) -> Optional[auth.UserRecord]:
    """
    Get Firebase user by email.

    Args:
        email: User email address

    Returns:
        UserRecord if found, None otherwise
    """
    if _firebase_app is None:
        return None

    try:
        return auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        return None
    except Exception:
        return None


def create_custom_token(uid: str, claims: Optional[dict] = None) -> Optional[str]:
    """
    Create a custom Firebase token.

    Args:
        uid: User UID
        claims: Optional custom claims

    Returns:
        Custom token string or None
    """
    if _firebase_app is None:
        return None

    try:
        return auth.create_custom_token(uid, claims)
    except Exception:
        return None


def set_custom_claims(uid: str, claims: dict) -> bool:
    """
    Set custom claims on a Firebase user.

    Args:
        uid: User UID
        claims: Claims to set

    Returns:
        True if successful
    """
    if _firebase_app is None:
        return False

    try:
        auth.set_custom_user_claims(uid, claims)
        return True
    except Exception:
        return False


def revoke_refresh_tokens(uid: str) -> bool:
    """
    Revoke all refresh tokens for a user.

    Args:
        uid: User UID

    Returns:
        True if successful
    """
    if _firebase_app is None:
        return False

    try:
        auth.revoke_refresh_tokens(uid)
        return True
    except Exception:
        return False
