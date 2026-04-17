from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import db, get_current_user


router = APIRouter()


@router.get("/audit-logs")
async def get_audit_logs(user: dict = Depends(get_current_user)):
    if user.get("role") != "owner":
        raise HTTPException(
            status_code=403, detail="Solo propietarios pueden ver logs de auditoría"
        )
    logs = (
        await db.audit_logs.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(100)
    )
    return logs
