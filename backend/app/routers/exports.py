import csv
import io

from fastapi import APIRouter, Depends
from starlette.responses import StreamingResponse

from app.dependencies import db, get_current_user, log_audit


router = APIRouter()


@router.get("/export/animals")
async def export_animals_csv(user: dict = Depends(get_current_user)):
    animals = await db.animals.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Nombre",
            "Arete",
            "Tipo",
            "Raza",
            "Sexo",
            "Peso (kg)",
            "Estado",
            "Fecha Nacimiento",
            "Parto Esperado",
            "Última Vacuna",
        ]
    )
    for animal in animals:
        writer.writerow(
            [
                animal.get("animal_id", ""),
                animal.get("name", ""),
                animal.get("tag_id", ""),
                animal.get("animal_type", ""),
                animal.get("breed", ""),
                animal.get("sex", ""),
                animal.get("weight", 0),
                animal.get("status", ""),
                animal.get("birth_date", ""),
                animal.get("expected_calving_date", ""),
                animal.get("last_vaccination_date", ""),
            ]
        )

    output.seek(0)
    await log_audit(user["user_id"], "export_csv", "animals")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agroflow_ganado.csv"},
    )


@router.get("/export/finances")
async def export_finances_csv(user: dict = Depends(get_current_user)):
    finances = await db.finances.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Tipo", "Categoría", "Monto", "Descripción", "Fecha"])
    for finance in finances:
        writer.writerow(
            [
                finance.get("finance_id", ""),
                finance.get("transaction_type", ""),
                finance.get("category", ""),
                finance.get("amount", 0),
                finance.get("description", ""),
                finance.get("date", ""),
            ]
        )

    output.seek(0)
    await log_audit(user["user_id"], "export_csv", "finances")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agroflow_finanzas.csv"},
    )
