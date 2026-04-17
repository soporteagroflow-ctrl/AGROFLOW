import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import db, get_current_user, log_audit
from app.schemas.paddocks import PaddockCreate


router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _counts_by_paddock(user_id: str) -> dict[str, int]:
    """Return {paddock_id: active_animal_count} in a single aggregation."""
    pipeline = [
        {"$match": {"user_id": user_id, "status": "activo"}},
        {"$group": {"_id": "$paddock_id", "count": {"$sum": 1}}},
    ]
    counts: dict[str, int] = {}
    async for row in db.animals.aggregate(pipeline):
        paddock_id = row.get("_id") or ""
        if paddock_id:
            counts[paddock_id] = row.get("count", 0)
    return counts


@router.get("/paddocks")
async def get_paddocks(user: dict = Depends(get_current_user)):
    paddocks = (
        await db.paddocks.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    counts = await _counts_by_paddock(user["user_id"])
    for paddock in paddocks:
        paddock["animal_count"] = counts.get(paddock["paddock_id"], 0)
    return paddocks


@router.post("/paddocks")
async def create_paddock(data: PaddockCreate, user: dict = Depends(get_current_user)):
    paddock = {
        "paddock_id": f"paddock_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.model_dump(),
        "created_at": _now_iso(),
    }
    await db.paddocks.insert_one(paddock)
    await log_audit(
        user["user_id"], "create", "paddock", paddock["paddock_id"], f"Creó {data.name}"
    )
    created = await db.paddocks.find_one({"paddock_id": paddock["paddock_id"]}, {"_id": 0})
    created["animal_count"] = 0
    return created


@router.get("/paddocks/{paddock_id}")
async def get_paddock(paddock_id: str, user: dict = Depends(get_current_user)):
    paddock = await db.paddocks.find_one(
        {"paddock_id": paddock_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not paddock:
        raise HTTPException(status_code=404, detail="Potrero no encontrado")
    count = await db.animals.count_documents(
        {"paddock_id": paddock_id, "user_id": user["user_id"], "status": "activo"}
    )
    paddock["animal_count"] = count
    animals = await db.animals.find(
        {"paddock_id": paddock_id, "user_id": user["user_id"]}, {"_id": 0}
    ).to_list(100)
    paddock["animals"] = animals
    return paddock


@router.put("/paddocks/{paddock_id}")
async def update_paddock(
    paddock_id: str, data: PaddockCreate, user: dict = Depends(get_current_user)
):
    result = await db.paddocks.update_one(
        {"paddock_id": paddock_id, "user_id": user["user_id"]},
        {"$set": data.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Potrero no encontrado")
    await log_audit(
        user["user_id"], "update", "paddock", paddock_id, f"Actualizó {data.name}"
    )
    updated = await db.paddocks.find_one({"paddock_id": paddock_id}, {"_id": 0})
    return updated


@router.delete("/paddocks/{paddock_id}")
async def delete_paddock(paddock_id: str, user: dict = Depends(get_current_user)):
    result = await db.paddocks.delete_one(
        {"paddock_id": paddock_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Potrero no encontrado")
    await log_audit(user["user_id"], "delete", "paddock", paddock_id)
    return {"message": "Potrero eliminado"}
