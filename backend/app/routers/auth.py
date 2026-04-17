import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import (
    db,
    get_current_user,
    limiter,
    log_audit,
    logger,
)
from app.schemas.auth import FirebaseTokenRequest, UserUpdate

try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None  # type: ignore


router = APIRouter()


@router.post("/auth/firebase")
@limiter.limit("10/minute")
async def firebase_login(request: Request, req: FirebaseTokenRequest):
    """Verify a Firebase ID token and create/update the user in MongoDB."""
    if firebase_auth is None:
        raise HTTPException(status_code=500, detail="Firebase Admin no disponible")

    try:
        decoded = firebase_auth.verify_id_token(req.id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token de Firebase inválido")

    firebase_uid = decoded.get("uid", "")
    email = decoded.get("email", "")
    name = decoded.get("name", "")
    picture = decoded.get("picture", "")

    if not firebase_uid or not email:
        raise HTTPException(status_code=401, detail="Token incompleto")

    # Find existing user by firebase_uid or email
    existing = await db.users.find_one(
        {"$or": [{"firebase_uid": firebase_uid}, {"email": email}]},
        {"_id": 0},
    )

    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": name,
                "picture": picture,
                "firebase_uid": firebase_uid,
            }},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "firebase_uid": firebase_uid,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "owner",
                "farm_name": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    await log_audit(user_id, "login", "auth")

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user}


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


@router.post("/auth/logout")
async def logout():
    # With Firebase, logout is client-side. This endpoint exists for audit.
    return {"message": "Sesión cerrada"}


@router.put("/auth/profile")
async def update_profile(data: UserUpdate, user: dict = Depends(get_current_user)):
    update = {}
    if data.farm_name:
        update["farm_name"] = data.farm_name
    if data.role:
        update["role"] = data.role
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
        await log_audit(
            user["user_id"],
            "update",
            "profile",
            user["user_id"],
            f"Campos: {', '.join(update.keys())}",
        )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated
