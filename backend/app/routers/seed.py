import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.dependencies import db, get_current_user


router = APIRouter()


@router.post("/seed")
async def seed_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    existing = await db.animals.count_documents({"user_id": uid})
    if existing > 0:
        return {"message": "Datos ya existentes", "seeded": False}

    paddocks_data = [
        {
            "name": "Potrero Norte",
            "area_hectares": 15,
            "grass_type": "Brachiaria",
            "grass_status": "bueno",
            "capacity": 20,
            "center_lat": 4.6097,
            "center_lng": -74.0817,
            "status": "activo",
        },
        {
            "name": "Potrero Sur",
            "area_hectares": 12,
            "grass_type": "Estrella",
            "grass_status": "regular",
            "capacity": 15,
            "center_lat": 4.6080,
            "center_lng": -74.0830,
            "status": "activo",
        },
        {
            "name": "Potrero Central",
            "area_hectares": 20,
            "grass_type": "Guinea",
            "grass_status": "bueno",
            "capacity": 25,
            "center_lat": 4.6090,
            "center_lng": -74.0800,
            "status": "en_descanso",
        },
    ]

    paddock_ids = []
    for paddock_data in paddocks_data:
        paddock_id = f"paddock_{uuid.uuid4().hex[:12]}"
        await db.paddocks.insert_one(
            {
                "paddock_id": paddock_id,
                "user_id": uid,
                **paddock_data,
                "coordinates": [],
                "notes": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        paddock_ids.append(paddock_id)

    animals_data = [
        {
            "name": "Lola",
            "tag_id": "A001",
            "breed": "Angus",
            "animal_type": "vaca",
            "birth_date": "2021-03-15",
            "weight": 450,
            "sex": "hembra",
            "paddock_id": paddock_ids[0],
            "expected_calving_date": "2026-03-20",
            "last_breeding_date": "2025-06-15",
            "last_vaccination_date": "2025-01-15",
        },
        {
            "name": "Toro Negro",
            "tag_id": "A002",
            "breed": "Brahman",
            "animal_type": "toro",
            "birth_date": "2020-06-20",
            "weight": 680,
            "sex": "macho",
            "paddock_id": paddock_ids[0],
            "expected_calving_date": "",
            "last_breeding_date": "",
            "last_vaccination_date": "2025-08-10",
        },
        {
            "name": "Manchas",
            "tag_id": "A003",
            "breed": "Holstein",
            "animal_type": "vaca",
            "birth_date": "2022-01-10",
            "weight": 420,
            "sex": "hembra",
            "paddock_id": paddock_ids[1],
            "expected_calving_date": "2026-04-05",
            "last_breeding_date": "2025-07-01",
            "last_vaccination_date": "2024-06-20",
        },
        {
            "name": "Ternero Luna",
            "tag_id": "A004",
            "breed": "Angus",
            "animal_type": "ternero",
            "birth_date": "2024-08-05",
            "weight": 120,
            "sex": "hembra",
            "paddock_id": paddock_ids[0],
            "expected_calving_date": "",
            "last_breeding_date": "",
            "last_vaccination_date": "2024-12-10",
        },
        {
            "name": "Valentina",
            "tag_id": "A005",
            "breed": "Simmental",
            "animal_type": "novilla",
            "birth_date": "2023-02-14",
            "weight": 320,
            "sex": "hembra",
            "paddock_id": paddock_ids[1],
            "expected_calving_date": "",
            "last_breeding_date": "",
            "last_vaccination_date": "2025-05-01",
        },
        {
            "name": "El Rey",
            "tag_id": "A006",
            "breed": "Charolais",
            "animal_type": "toro",
            "birth_date": "2019-11-25",
            "weight": 750,
            "sex": "macho",
            "paddock_id": paddock_ids[0],
            "expected_calving_date": "",
            "last_breeding_date": "",
            "last_vaccination_date": "2025-03-15",
        },
        {
            "name": "Estrella",
            "tag_id": "A007",
            "breed": "Jersey",
            "animal_type": "vaca",
            "birth_date": "2021-07-08",
            "weight": 380,
            "sex": "hembra",
            "paddock_id": paddock_ids[1],
            "expected_calving_date": "2026-03-10",
            "last_breeding_date": "2025-06-05",
            "last_vaccination_date": "2025-01-20",
        },
        {
            "name": "Becerro Sol",
            "tag_id": "A008",
            "breed": "Brahman",
            "animal_type": "ternero",
            "birth_date": "2025-01-20",
            "weight": 80,
            "sex": "macho",
            "paddock_id": paddock_ids[0],
            "expected_calving_date": "",
            "last_breeding_date": "",
            "last_vaccination_date": "2025-02-15",
        },
    ]

    animal_ids = []
    for animal_data in animals_data:
        animal_id = f"animal_{uuid.uuid4().hex[:12]}"
        await db.animals.insert_one(
            {
                "animal_id": animal_id,
                "user_id": uid,
                **animal_data,
                "status": "activo",
                "notes": "",
                "mother_id": "",
                "father_id": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        animal_ids.append(animal_id)

    health_data = [
        {
            "animal_id": animal_ids[0],
            "record_type": "vacuna",
            "description": "Fiebre aftosa - dosis anual",
            "date": "2025-01-15",
            "veterinarian": "Dr. García",
        },
        {
            "animal_id": animal_ids[1],
            "record_type": "revision",
            "description": "Revisión general - buen estado",
            "date": "2025-02-01",
            "veterinarian": "Dr. García",
        },
        {
            "animal_id": animal_ids[2],
            "record_type": "tratamiento",
            "description": "Desparasitación interna",
            "date": "2025-01-20",
            "veterinarian": "Dr. López",
        },
        {
            "animal_id": animal_ids[3],
            "record_type": "vacuna",
            "description": "Clostridial - primera dosis",
            "date": "2024-12-10",
            "veterinarian": "Dr. García",
        },
    ]
    for health_record in health_data:
        await db.health_records.insert_one(
            {
                "record_id": f"health_{uuid.uuid4().hex[:12]}",
                "user_id": uid,
                **health_record,
                "notes": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    finance_data = [
        {
            "transaction_type": "ingreso",
            "category": "venta_ganado",
            "amount": 2500000,
            "description": "Venta de 2 novillos",
            "date": "2025-01-10",
        },
        {
            "transaction_type": "gasto",
            "category": "compra_alimento",
            "amount": 450000,
            "description": "Sal mineralizada y concentrado",
            "date": "2025-01-15",
        },
        {
            "transaction_type": "gasto",
            "category": "veterinario",
            "amount": 180000,
            "description": "Vacunación completa del hato",
            "date": "2025-01-20",
        },
        {
            "transaction_type": "ingreso",
            "category": "venta_leche",
            "amount": 800000,
            "description": "Venta de leche mensual",
            "date": "2025-02-01",
        },
        {
            "transaction_type": "gasto",
            "category": "mantenimiento",
            "amount": 350000,
            "description": "Reparación cercas potrero norte",
            "date": "2025-02-05",
        },
    ]
    for finance_record in finance_data:
        await db.finances.insert_one(
            {
                "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
                "user_id": uid,
                **finance_record,
                "animal_id": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    return {"message": "Datos de ejemplo creados exitosamente", "seeded": True}
