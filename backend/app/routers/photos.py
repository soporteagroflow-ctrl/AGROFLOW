"""Photo endpoints.

Photos are stored on the filesystem (under ``UPLOAD_DIR``, configurable via
env). MongoDB only stores metadata (photo_id, filename, content_type,
description, size), which keeps documents small and avoids bumping into the
16 MB BSON limit.
"""

import base64
import binascii
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from app.dependencies import db, get_current_user, limiter, log_audit, sanitize_string
from app.schemas.animals import PhotoUpload


router = APIRouter()

UPLOAD_ROOT = Path(os.environ.get("UPLOAD_DIR", "/tmp/agroflow_photos"))
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB decoded
ALLOWED_PREFIXES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",
}


def _detect_mime(raw: bytes) -> str:
    for prefix, mime in ALLOWED_PREFIXES.items():
        if raw.startswith(prefix):
            return mime
    return ""


@router.post("/animals/{animal_id}/photo")
@limiter.limit("20/minute")
async def upload_animal_photo(
    request: Request,
    animal_id: str,
    data: PhotoUpload,
    user: dict = Depends(get_current_user),
):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")

    payload = data.photo_base64 or ""
    if "," in payload and payload.startswith("data:"):
        payload = payload.split(",", 1)[1]

    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Base64 inválido")

    if len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx 5MB)")

    mime = _detect_mime(raw)
    if not mime:
        raise HTTPException(status_code=400, detail="Formato de imagen no soportado")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }[mime]
    photo_id = f"photo_{uuid.uuid4().hex[:12]}"

    user_dir = UPLOAD_ROOT / user["user_id"]
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{photo_id}{ext}"
    disk_path = user_dir / filename
    disk_path.write_bytes(raw)

    doc = {
        "photo_id": photo_id,
        "animal_id": animal_id,
        "user_id": user["user_id"],
        "filename": filename,
        "content_type": mime,
        "size_bytes": len(raw),
        "description": sanitize_string(data.description, 200),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.animal_photos.insert_one(doc)
    await log_audit(user["user_id"], "upload_photo", "animal", animal_id)

    return {
        "photo_id": photo_id,
        "url": f"/api/animals/{animal_id}/photos/{photo_id}/file",
        "content_type": mime,
        "size_bytes": len(raw),
        "message": "Foto subida exitosamente",
    }


@router.get("/animals/{animal_id}/photos")
async def get_animal_photos(animal_id: str, user: dict = Depends(get_current_user)):
    photos = (
        await db.animal_photos.find(
            {"animal_id": animal_id, "user_id": user["user_id"]},
            {"_id": 0, "photo_base64": 0},
        )
        .sort("created_at", -1)
        .to_list(50)
    )
    for photo in photos:
        photo["url"] = f"/api/animals/{animal_id}/photos/{photo['photo_id']}/file"
    return photos


@router.get("/animals/{animal_id}/photos/{photo_id}/file")
async def get_photo_file(
    animal_id: str, photo_id: str, user: dict = Depends(get_current_user)
):
    photo = await db.animal_photos.find_one(
        {"photo_id": photo_id, "animal_id": animal_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    filename = photo.get("filename")
    if not filename:
        raise HTTPException(status_code=410, detail="Foto sin archivo en disco")

    disk_path = UPLOAD_ROOT / user["user_id"] / filename
    if not disk_path.exists():
        raise HTTPException(status_code=410, detail="Archivo no disponible")

    return FileResponse(
        path=str(disk_path),
        media_type=photo.get("content_type", "application/octet-stream"),
        filename=filename,
    )


@router.delete("/animals/{animal_id}/photos/{photo_id}")
async def delete_animal_photo(
    animal_id: str, photo_id: str, user: dict = Depends(get_current_user)
):
    photo = await db.animal_photos.find_one(
        {"photo_id": photo_id, "animal_id": animal_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    filename = photo.get("filename")
    if filename:
        disk_path = UPLOAD_ROOT / user["user_id"] / filename
        try:
            disk_path.unlink(missing_ok=True)
        except OSError:
            pass

    await db.animal_photos.delete_one({"photo_id": photo_id})
    await log_audit(user["user_id"], "delete_photo", "animal", animal_id)
    return {"message": "Foto eliminada"}
