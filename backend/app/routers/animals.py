import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import db, get_current_user, log_audit
from app.schemas.animals import AnimalCreate, HealthRecordCreate, WeightRecordCreate


router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/animals")
async def get_animals(user: dict = Depends(get_current_user)):
    animals = (
        await db.animals.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(1000)
    )
    return animals


@router.post("/animals")
async def create_animal(data: AnimalCreate, user: dict = Depends(get_current_user)):
    animal = {
        "animal_id": f"animal_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.model_dump(),
        "created_at": _now_iso(),
    }
    await db.animals.insert_one(animal)
    await log_audit(
        user["user_id"], "create", "animal", animal["animal_id"], f"Creó {data.name}"
    )
    created = await db.animals.find_one({"animal_id": animal["animal_id"]}, {"_id": 0})
    return created


@router.get("/animals/{animal_id}")
async def get_animal(animal_id: str, user: dict = Depends(get_current_user)):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal


@router.put("/animals/{animal_id}")
async def update_animal(
    animal_id: str, data: AnimalCreate, user: dict = Depends(get_current_user)
):
    result = await db.animals.update_one(
        {"animal_id": animal_id, "user_id": user["user_id"]},
        {"$set": data.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    await log_audit(
        user["user_id"], "update", "animal", animal_id, f"Actualizó {data.name}"
    )
    updated = await db.animals.find_one({"animal_id": animal_id}, {"_id": 0})
    return updated


@router.delete("/animals/{animal_id}")
async def delete_animal(animal_id: str, user: dict = Depends(get_current_user)):
    result = await db.animals.delete_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    await log_audit(user["user_id"], "delete", "animal", animal_id)
    return {"message": "Animal eliminado"}


@router.post("/animals/{animal_id}/health")
async def add_health_record(
    animal_id: str, data: HealthRecordCreate, user: dict = Depends(get_current_user)
):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    record = {
        "record_id": f"health_{uuid.uuid4().hex[:12]}",
        "animal_id": animal_id,
        "user_id": user["user_id"],
        **data.model_dump(),
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": _now_iso(),
    }
    await db.health_records.insert_one(record)
    await log_audit(
        user["user_id"],
        "create",
        "health_record",
        record["record_id"],
        f"{data.record_type} para {animal.get('name', animal_id)}",
    )
    created = await db.health_records.find_one({"record_id": record["record_id"]}, {"_id": 0})
    return created


@router.get("/animals/{animal_id}/health")
async def get_health_records(animal_id: str, user: dict = Depends(get_current_user)):
    records = (
        await db.health_records.find(
            {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        .sort("date", -1)
        .to_list(100)
    )
    return records


@router.post("/animals/{animal_id}/weight")
async def add_weight_record(
    animal_id: str, data: WeightRecordCreate, user: dict = Depends(get_current_user)
):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    record = {
        "record_id": f"weight_{uuid.uuid4().hex[:12]}",
        "animal_id": animal_id,
        "user_id": user["user_id"],
        "weight": data.weight,
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "notes": data.notes,
        "created_at": _now_iso(),
    }
    await db.weight_records.insert_one(record)
    await db.animals.update_one({"animal_id": animal_id}, {"$set": {"weight": data.weight}})
    await log_audit(
        user["user_id"],
        "create",
        "weight_record",
        record["record_id"],
        f"{data.weight} kg",
    )
    created = await db.weight_records.find_one({"record_id": record["record_id"]}, {"_id": 0})
    return created


@router.get("/animals/{animal_id}/weight")
async def get_weight_records(animal_id: str, user: dict = Depends(get_current_user)):
    records = (
        await db.weight_records.find(
            {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        .sort("date", -1)
        .to_list(100)
    )
    return records
