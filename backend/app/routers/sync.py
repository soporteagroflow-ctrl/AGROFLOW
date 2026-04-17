import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.dependencies import db, get_current_user, limiter, log_audit
from app.schemas.sync import SyncRequest


router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/sync")
@limiter.limit("30/minute")
async def sync_offline_data(
    request,  # Required by slowapi; consumed via ``request`` kw name
    payload: SyncRequest,
    user: dict = Depends(get_current_user),
):
    uid = user["user_id"]
    results = {"created": 0, "errors": []}

    for op in payload.operations:
        try:
            data = op.data.model_dump()
            # Never trust client-provided tenant fields.
            data.pop("user_id", None)

            if op.type == "create_animal":
                await db.animals.insert_one(
                    {
                        "animal_id": f"animal_{uuid.uuid4().hex[:12]}",
                        "user_id": uid,
                        **data,
                        "created_at": _now_iso(),
                    }
                )
                results["created"] += 1

            elif op.type == "create_paddock":
                await db.paddocks.insert_one(
                    {
                        "paddock_id": f"paddock_{uuid.uuid4().hex[:12]}",
                        "user_id": uid,
                        **data,
                        "created_at": _now_iso(),
                    }
                )
                results["created"] += 1

            elif op.type == "create_finance":
                await db.finances.insert_one(
                    {
                        "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
                        "user_id": uid,
                        **data,
                        "date": data.get("date") or _now_iso()[:10],
                        "created_at": _now_iso(),
                    }
                )
                results["created"] += 1

            elif op.type == "create_health":
                # Health records belong to an animal owned by this user.
                animal = await db.animals.find_one(
                    {"animal_id": op.animal_id, "user_id": uid},
                    {"_id": 0, "animal_id": 1},
                )
                if not animal:
                    results["errors"].append(
                        {"op": op.type, "error": "Animal no encontrado"}
                    )
                    continue
                await db.health_records.insert_one(
                    {
                        "record_id": f"health_{uuid.uuid4().hex[:12]}",
                        "user_id": uid,
                        "animal_id": op.animal_id,
                        **data,
                        "date": data.get("date") or _now_iso()[:10],
                        "created_at": _now_iso(),
                    }
                )
                results["created"] += 1

        except Exception as exc:
            results["errors"].append({"op": op.type, "error": str(exc)})

    await log_audit(
        uid,
        "sync",
        "offline_queue",
        details=f"creados={results['created']} errores={len(results['errors'])}",
    )
    return results
