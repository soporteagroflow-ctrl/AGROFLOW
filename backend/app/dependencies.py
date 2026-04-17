import hashlib
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from dotenv import load_dotenv
from fastapi import HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.util import get_remote_address


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


# --- Firebase Admin SDK initialization ---
_cred_path = ROOT_DIR / "firebase_credentials.json"
if _cred_path.exists():
    _cred = credentials.Certificate(str(_cred_path))
    firebase_admin.initialize_app(_cred)
    logger.info("Firebase Admin SDK initialized from %s", _cred_path)
else:
    # Try initializing with Application Default Credentials (ADC)
    try:
        firebase_admin.initialize_app()
        logger.info("Firebase Admin SDK initialized with ADC")
    except Exception as exc:
        logger.warning(
            "Firebase Admin SDK NOT initialized: %s. "
            "Place firebase_credentials.json in backend/ or set GOOGLE_APPLICATION_CREDENTIALS.",
            exc,
        )


def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize string input to prevent injection and limit size."""
    if not value:
        return value
    value = re.sub(r"<[^>]+>", "", value)
    return value[:max_length].strip()


async def log_audit(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str = "",
    details: str = "",
):
    """Log user actions for audit trail."""
    try:
        await db.audit_logs.insert_one(
            {
                "log_id": f"log_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "action": action,
                "resource": resource,
                "resource_id": resource_id,
                "details": details,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ip": "",
            }
        )
    except Exception as exc:
        logger.warning("Audit log error: %s", exc)


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return ""


async def get_current_user(request: Request) -> dict:
    """Verify Firebase ID token and return the user from MongoDB."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception:
        raise HTTPException(status_code=401, detail="Error verificando token")

    firebase_uid = decoded.get("uid", "")
    email = decoded.get("email", "")

    if not firebase_uid or not email:
        raise HTTPException(status_code=401, detail="Token incompleto")

    # Look up user by firebase_uid or email
    user = await db.users.find_one(
        {"$or": [{"firebase_uid": firebase_uid}, {"email": email}]},
        {"_id": 0},
    )
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return user
