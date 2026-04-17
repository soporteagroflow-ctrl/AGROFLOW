from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.dependencies import db, get_current_user


router = APIRouter()


async def _animal_count_by_type(user_id: str) -> dict[str, int]:
    pipeline = [
        {"$match": {"user_id": user_id, "status": "activo"}},
        {"$group": {"_id": "$animal_type", "count": {"$sum": 1}}},
    ]
    result: dict[str, int] = {}
    async for row in db.animals.aggregate(pipeline):
        result[row["_id"] or ""] = row.get("count", 0)
    return result


async def _animal_count_by_status(user_id: str) -> dict[str, int]:
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    result: dict[str, int] = {}
    async for row in db.animals.aggregate(pipeline):
        result[row["_id"] or ""] = row.get("count", 0)
    return result


async def _avg_active_weight(user_id: str) -> float:
    pipeline = [
        {"$match": {"user_id": user_id, "status": "activo", "weight": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$weight"}}},
    ]
    async for row in db.animals.aggregate(pipeline):
        avg = row.get("avg") or 0
        return round(float(avg), 1)
    return 0.0


async def _finance_totals(user_id: str) -> dict[str, float]:
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$transaction_type", "amount": {"$sum": "$amount"}}},
    ]
    totals = {"ingreso": 0.0, "gasto": 0.0}
    async for row in db.finances.aggregate(pipeline):
        if row["_id"] in totals:
            totals[row["_id"]] = row.get("amount", 0) or 0
    return totals


async def _counts_by_paddock_active(user_id: str) -> dict[str, int]:
    pipeline = [
        {"$match": {"user_id": user_id, "status": "activo"}},
        {"$group": {"_id": "$paddock_id", "count": {"$sum": 1}}},
    ]
    result: dict[str, int] = {}
    async for row in db.animals.aggregate(pipeline):
        key = row.get("_id") or ""
        if key:
            result[key] = row.get("count", 0)
    return result


@router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    uid = user["user_id"]

    by_type = await _animal_count_by_type(uid)
    by_status = await _animal_count_by_status(uid)

    total_animals = sum(by_type.values())
    avg_weight = await _avg_active_weight(uid)

    total_paddocks = await db.paddocks.count_documents({"user_id": uid})
    active_paddocks = await db.paddocks.count_documents({"user_id": uid, "status": "activo"})
    resting_paddocks = await db.paddocks.count_documents(
        {"user_id": uid, "status": "en_descanso"}
    )

    totals = await _finance_totals(uid)

    recent_health = (
        await db.health_records.find({"user_id": uid}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(5)
    )

    grass_good = await db.paddocks.count_documents(
        {"user_id": uid, "grass_status": "bueno"}
    )
    grass_regular = await db.paddocks.count_documents(
        {"user_id": uid, "grass_status": "regular"}
    )
    grass_bad = await db.paddocks.count_documents({"user_id": uid, "grass_status": "malo"})

    return {
        "animals": {
            "total": total_animals,
            "cows": by_type.get("vaca", 0),
            "bulls": by_type.get("toro", 0),
            "calves": by_type.get("ternero", 0),
            "heifers": by_type.get("novilla", 0),
            "sold": by_status.get("vendido", 0),
            "dead": by_status.get("muerto", 0),
            "avg_weight": avg_weight,
        },
        "paddocks": {
            "total": total_paddocks,
            "active": active_paddocks,
            "resting": resting_paddocks,
            "grass_good": grass_good,
            "grass_regular": grass_regular,
            "grass_bad": grass_bad,
        },
        "finance": {
            "total_income": totals["ingreso"],
            "total_expense": totals["gasto"],
            "profit": totals["ingreso"] - totals["gasto"],
        },
        "recent_health": recent_health,
    }


def _parse_dt(dt_str: str):
    try:
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


@router.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    alerts = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_dt = datetime.now(timezone.utc)

    # Bounded page so very-large herds don't blow up memory.
    animals = await db.animals.find(
        {"user_id": uid, "status": "activo"}, {"_id": 0}
    ).to_list(2000)
    animal_ids = [animal["animal_id"] for animal in animals]

    latest_health: dict[str, str] = {}
    latest_vaccine: dict[str, str] = {}

    if animal_ids:
        async for row in db.health_records.aggregate(
            [
                {"$match": {"user_id": uid, "animal_id": {"$in": animal_ids}}},
                {"$sort": {"date": -1}},
                {"$group": {"_id": "$animal_id", "date": {"$first": "$date"}}},
            ]
        ):
            latest_health[row["_id"]] = row.get("date", "")

        async for row in db.health_records.aggregate(
            [
                {
                    "$match": {
                        "user_id": uid,
                        "animal_id": {"$in": animal_ids},
                        "record_type": "vacuna",
                    }
                },
                {"$sort": {"date": -1}},
                {"$group": {"_id": "$animal_id", "date": {"$first": "$date"}}},
            ]
        ):
            latest_vaccine[row["_id"]] = row.get("date", "")

    for animal in animals:
        animal_id = animal["animal_id"]

        # Vaccinations: prefer field on animal, fall back to latest vaccine record.
        last_vac = animal.get("last_vaccination_date") or latest_vaccine.get(animal_id, "")
        vac_dt = _parse_dt(last_vac) if last_vac else None
        if vac_dt:
            days_since = (today_dt - vac_dt).days
            if days_since > 180:
                alerts.append(
                    {
                        "alert_id": f"vac_{animal_id}",
                        "type": "vacunacion_pendiente",
                        "severity": "alta" if days_since > 365 else "media",
                        "title": f"Vacunación pendiente: {animal['name']}",
                        "description": f"Última vacuna hace {days_since} días (#{animal.get('tag_id', '')})",
                        "animal_id": animal_id,
                        "animal_name": animal["name"],
                        "date": today,
                    }
                )

        # Calving
        calving = animal.get("expected_calving_date") or ""
        calv_dt = _parse_dt(calving) if calving else None
        if calv_dt:
            days_until = (calv_dt - today_dt).days
            if 0 <= days_until <= 30:
                alerts.append(
                    {
                        "alert_id": f"parto_{animal_id}",
                        "type": "parto_proximo",
                        "severity": "alta" if days_until <= 7 else "media",
                        "title": f"Parto próximo: {animal['name']}",
                        "description": f"Parto esperado en {days_until} días ({calving})",
                        "animal_id": animal_id,
                        "animal_name": animal["name"],
                        "date": calving,
                    }
                )
            elif -14 <= days_until < 0:
                alerts.append(
                    {
                        "alert_id": f"parto_atrasado_{animal_id}",
                        "type": "parto_proximo",
                        "severity": "alta",
                        "title": f"¡Parto atrasado!: {animal['name']}",
                        "description": f"Fecha esperada fue {calving} ({abs(days_until)} días atrás)",
                        "animal_id": animal_id,
                        "animal_name": animal["name"],
                        "date": calving,
                    }
                )

        # Last review
        last_health = latest_health.get(animal_id, "")
        health_dt = _parse_dt(last_health) if last_health else None
        if health_dt:
            days_since = (today_dt - health_dt).days
            if days_since > 90:
                alerts.append(
                    {
                        "alert_id": f"revision_{animal_id}",
                        "type": "revision_pendiente",
                        "severity": "baja",
                        "title": f"Revisión pendiente: {animal['name']}",
                        "description": f"Sin revisión hace {days_since} días",
                        "animal_id": animal_id,
                        "animal_name": animal["name"],
                        "date": today,
                    }
                )

    # Paddocks - animal counts via aggregate instead of per-paddock queries.
    paddocks = await db.paddocks.find({"user_id": uid}, {"_id": 0}).to_list(200)
    counts_by_paddock = await _counts_by_paddock_active(uid)

    for paddock in paddocks:
        count = counts_by_paddock.get(paddock["paddock_id"], 0)
        capacity = paddock.get("capacity", 0)
        if capacity > 0 and count > capacity:
            alerts.append(
                {
                    "alert_id": f"saturado_{paddock['paddock_id']}",
                    "type": "potrero_saturado",
                    "severity": "alta",
                    "title": f"Potrero saturado: {paddock['name']}",
                    "description": f"{count} animales / capacidad {capacity}",
                    "paddock_id": paddock["paddock_id"],
                    "date": today,
                }
            )
        if paddock.get("grass_status") == "malo":
            alerts.append(
                {
                    "alert_id": f"pasto_{paddock['paddock_id']}",
                    "type": "pasto_deteriorado",
                    "severity": "media",
                    "title": f"Pasto deteriorado: {paddock['name']}",
                    "description": f"El pasto en {paddock['name']} necesita atención ({paddock.get('grass_type', '')})",
                    "paddock_id": paddock["paddock_id"],
                    "date": today,
                }
            )

    severity_order = {"alta": 0, "media": 1, "baja": 2}
    alerts.sort(key=lambda item: severity_order.get(item.get("severity", "baja"), 3))
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/ndvi")
async def get_ndvi_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    paddocks = await db.paddocks.find({"user_id": uid}, {"_id": 0}).to_list(200)
    counts_by_paddock = await _counts_by_paddock_active(uid)

    ndvi_data = []
    for paddock in paddocks:
        count = counts_by_paddock.get(paddock["paddock_id"], 0)
        grass = paddock.get("grass_status", "bueno")
        ndvi_value = {"bueno": 0.75, "regular": 0.45, "malo": 0.2}.get(grass, 0.5)
        capacity = paddock.get("capacity", 0)
        usage = (count / capacity * 100) if capacity > 0 else 0

        ndvi_data.append(
            {
                "paddock_id": paddock["paddock_id"],
                "name": paddock["name"],
                "center_lat": paddock.get("center_lat", 0),
                "center_lng": paddock.get("center_lng", 0),
                "area_hectares": paddock.get("area_hectares", 0),
                "grass_status": grass,
                "grass_type": paddock.get("grass_type", ""),
                "ndvi_value": ndvi_value,
                "animal_count": count,
                "capacity": capacity,
                "usage_percent": round(usage, 1),
                "status": paddock.get("status", "activo"),
                "recommendation": _get_ndvi_recommendation(
                    grass, usage, paddock.get("status", "")
                ),
            }
        )

    return {"paddocks": ndvi_data, "total": len(ndvi_data)}


def _get_ndvi_recommendation(grass: str, usage: float, status: str) -> str:
    if grass == "malo":
        return "Retirar ganado y dejar en descanso mínimo 30 días"
    if usage > 100:
        return "Potrero saturado - mover animales a otro potrero"
    if grass == "regular" and usage > 70:
        return "Reducir carga animal o considerar rotación"
    if status == "en_descanso":
        return "En periodo de descanso - monitorear recuperación"
    if grass == "bueno" and usage < 50:
        return "Buen estado - puede recibir más animales"
    return "Estado óptimo"
