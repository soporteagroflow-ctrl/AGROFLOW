import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import db, get_current_user, log_audit
from app.schemas.finances import FinanceCreate


router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/finances")
async def get_finances(user: dict = Depends(get_current_user)):
    finances = (
        await db.finances.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("date", -1)
        .to_list(500)
    )
    return finances


@router.post("/finances")
async def create_finance(data: FinanceCreate, user: dict = Depends(get_current_user)):
    finance = {
        "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.model_dump(),
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": _now_iso(),
    }
    await db.finances.insert_one(finance)
    await log_audit(
        user["user_id"],
        "create",
        "finance",
        finance["finance_id"],
        f"{data.transaction_type} {data.category} {data.amount}",
    )
    created = await db.finances.find_one({"finance_id": finance["finance_id"]}, {"_id": 0})
    return created


@router.delete("/finances/{finance_id}")
async def delete_finance(finance_id: str, user: dict = Depends(get_current_user)):
    result = await db.finances.delete_one(
        {"finance_id": finance_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    await log_audit(user["user_id"], "delete", "finance", finance_id)
    return {"message": "Registro eliminado"}


@router.get("/finances/summary")
async def get_finance_summary(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["user_id"]}},
        {
            "$group": {
                "_id": {
                    "ttype": "$transaction_type",
                    "category": "$category",
                },
                "amount": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
    ]
    total_income = 0.0
    total_expense = 0.0
    categories: dict[str, float] = {}
    transaction_count = 0

    async for row in db.finances.aggregate(pipeline):
        key = row["_id"]
        amount = row.get("amount", 0) or 0
        count = row.get("count", 0) or 0
        transaction_count += count
        if key.get("ttype") == "ingreso":
            total_income += amount
        elif key.get("ttype") == "gasto":
            total_expense += amount
        category = key.get("category") or "otros"
        categories[category] = categories.get(category, 0) + amount

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "profit": total_income - total_expense,
        "categories": categories,
        "transaction_count": transaction_count,
    }
