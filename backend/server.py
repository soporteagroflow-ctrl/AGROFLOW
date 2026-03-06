from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import uuid
import httpx
import csv
import io
import re
import hashlib
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from starlette.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AgroFlow API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_router = APIRouter(prefix="/api")

# --- Input Sanitization ---

def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize string input to prevent injection and limit size"""
    if not value:
        return value
    # Strip HTML tags
    value = re.sub(r'<[^>]+>', '', value)
    # Limit length
    value = value[:max_length].strip()
    return value

# --- Audit Logger ---

async def log_audit(user_id: str, action: str, resource: str, resource_id: str = "", details: str = ""):
    """Log user actions for audit trail"""
    try:
        await db.audit_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ip": "",
        })
    except Exception as e:
        logger.warning(f"Audit log error: {e}")

# --- Pydantic Models ---

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    role: str = "owner"
    farm_name: str = ""

class SessionRequest(BaseModel):
    session_id: str

class AnimalCreate(BaseModel):
    name: str
    tag_id: str = ""
    breed: str = ""
    animal_type: str = "vaca"  # vaca, toro, ternero, novilla
    birth_date: str = ""
    weight: float = 0
    sex: str = "hembra"
    status: str = "activo"  # activo, vendido, muerto
    paddock_id: str = ""
    notes: str = ""
    mother_id: str = ""
    father_id: str = ""
    expected_calving_date: str = ""
    last_breeding_date: str = ""
    last_vaccination_date: str = ""

class AnimalOut(BaseModel):
    animal_id: str
    user_id: str
    name: str
    tag_id: str = ""
    breed: str = ""
    animal_type: str = "vaca"
    birth_date: str = ""
    weight: float = 0
    sex: str = "hembra"
    status: str = "activo"
    paddock_id: str = ""
    notes: str = ""
    mother_id: str = ""
    father_id: str = ""
    created_at: str = ""

class HealthRecordCreate(BaseModel):
    record_type: str  # vacuna, tratamiento, revision, enfermedad
    description: str
    date: str = ""
    veterinarian: str = ""
    notes: str = ""

class WeightRecordCreate(BaseModel):
    weight: float
    date: str = ""
    notes: str = ""

class PaddockCreate(BaseModel):
    name: str
    area_hectares: float = 0
    grass_type: str = ""
    grass_status: str = "bueno"  # bueno, regular, malo
    capacity: int = 0
    coordinates: list = []  # [{lat, lng}]
    center_lat: float = 0
    center_lng: float = 0
    status: str = "activo"  # activo, en_descanso, mantenimiento
    notes: str = ""

class PaddockOut(BaseModel):
    paddock_id: str
    user_id: str
    name: str
    area_hectares: float = 0
    grass_type: str = ""
    grass_status: str = "bueno"
    capacity: int = 0
    coordinates: list = []
    center_lat: float = 0
    center_lng: float = 0
    status: str = "activo"
    notes: str = ""
    animal_count: int = 0
    created_at: str = ""

class FinanceCreate(BaseModel):
    transaction_type: str  # ingreso, gasto
    category: str  # venta_ganado, compra_alimento, veterinario, etc
    amount: float
    description: str = ""
    date: str = ""
    animal_id: str = ""

class FinanceOut(BaseModel):
    finance_id: str
    user_id: str
    transaction_type: str
    category: str
    amount: float
    description: str = ""
    date: str = ""
    animal_id: str = ""
    created_at: str = ""

class UserUpdate(BaseModel):
    farm_name: str = ""
    role: str = ""

# --- Auth Helpers ---

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    session = await db.user_sessions.find_one(
        {"session_token": token}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesión expirada")
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]}, {"_id": 0}
    )
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

# --- Auth Endpoints ---

@api_router.post("/auth/session")
@limiter.limit("10/minute")
async def exchange_session(request: Request, req: SessionRequest, response: Response):
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": req.session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Sesión inválida de OAuth")
    
    data = resp.json()
    email = data.get("email", "")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token", "")
    
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "owner",
            "farm_name": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
        max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Sesión cerrada"}

@api_router.put("/auth/profile")
async def update_profile(data: UserUpdate, user: dict = Depends(get_current_user)):
    update = {}
    if data.farm_name:
        update["farm_name"] = data.farm_name
    if data.role:
        update["role"] = data.role
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# --- Animals Endpoints ---

@api_router.get("/animals")
async def get_animals(user: dict = Depends(get_current_user)):
    animals = await db.animals.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return animals

@api_router.post("/animals")
async def create_animal(data: AnimalCreate, user: dict = Depends(get_current_user)):
    animal = {
        "animal_id": f"animal_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.animals.insert_one(animal)
    await log_audit(user["user_id"], "create", "animal", animal["animal_id"], f"Creó {data.name}")
    created = await db.animals.find_one({"animal_id": animal["animal_id"]}, {"_id": 0})
    return created

@api_router.get("/animals/{animal_id}")
async def get_animal(animal_id: str, user: dict = Depends(get_current_user)):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal

@api_router.put("/animals/{animal_id}")
async def update_animal(animal_id: str, data: AnimalCreate, user: dict = Depends(get_current_user)):
    result = await db.animals.update_one(
        {"animal_id": animal_id, "user_id": user["user_id"]},
        {"$set": data.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    updated = await db.animals.find_one({"animal_id": animal_id}, {"_id": 0})
    return updated

@api_router.delete("/animals/{animal_id}")
async def delete_animal(animal_id: str, user: dict = Depends(get_current_user)):
    result = await db.animals.delete_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return {"message": "Animal eliminado"}

# --- Health Records ---

@api_router.post("/animals/{animal_id}/health")
async def add_health_record(animal_id: str, data: HealthRecordCreate, user: dict = Depends(get_current_user)):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    record = {
        "record_id": f"health_{uuid.uuid4().hex[:12]}",
        "animal_id": animal_id,
        "user_id": user["user_id"],
        **data.dict(),
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.health_records.insert_one(record)
    created = await db.health_records.find_one({"record_id": record["record_id"]}, {"_id": 0})
    return created

@api_router.get("/animals/{animal_id}/health")
async def get_health_records(animal_id: str, user: dict = Depends(get_current_user)):
    records = await db.health_records.find(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).to_list(100)
    return records

# --- Weight Records ---

@api_router.post("/animals/{animal_id}/weight")
async def add_weight_record(animal_id: str, data: WeightRecordCreate, user: dict = Depends(get_current_user)):
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weight_records.insert_one(record)
    # Update animal's current weight
    await db.animals.update_one(
        {"animal_id": animal_id}, {"$set": {"weight": data.weight}}
    )
    created = await db.weight_records.find_one({"record_id": record["record_id"]}, {"_id": 0})
    return created

@api_router.get("/animals/{animal_id}/weight")
async def get_weight_records(animal_id: str, user: dict = Depends(get_current_user)):
    records = await db.weight_records.find(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).to_list(100)
    return records

# --- Paddocks Endpoints ---

@api_router.get("/paddocks")
async def get_paddocks(user: dict = Depends(get_current_user)):
    paddocks = await db.paddocks.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    # Add animal count per paddock
    for p in paddocks:
        count = await db.animals.count_documents(
            {"paddock_id": p["paddock_id"], "user_id": user["user_id"], "status": "activo"}
        )
        p["animal_count"] = count
    return paddocks

@api_router.post("/paddocks")
async def create_paddock(data: PaddockCreate, user: dict = Depends(get_current_user)):
    paddock = {
        "paddock_id": f"paddock_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.paddocks.insert_one(paddock)
    created = await db.paddocks.find_one({"paddock_id": paddock["paddock_id"]}, {"_id": 0})
    created["animal_count"] = 0
    return created

@api_router.get("/paddocks/{paddock_id}")
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

@api_router.put("/paddocks/{paddock_id}")
async def update_paddock(paddock_id: str, data: PaddockCreate, user: dict = Depends(get_current_user)):
    result = await db.paddocks.update_one(
        {"paddock_id": paddock_id, "user_id": user["user_id"]},
        {"$set": data.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Potrero no encontrado")
    updated = await db.paddocks.find_one({"paddock_id": paddock_id}, {"_id": 0})
    return updated

@api_router.delete("/paddocks/{paddock_id}")
async def delete_paddock(paddock_id: str, user: dict = Depends(get_current_user)):
    result = await db.paddocks.delete_one(
        {"paddock_id": paddock_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Potrero no encontrado")
    return {"message": "Potrero eliminado"}

# --- Finance Endpoints ---

@api_router.get("/finances")
async def get_finances(user: dict = Depends(get_current_user)):
    finances = await db.finances.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).to_list(500)
    return finances

@api_router.post("/finances")
async def create_finance(data: FinanceCreate, user: dict = Depends(get_current_user)):
    finance = {
        "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **data.dict(),
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.finances.insert_one(finance)
    created = await db.finances.find_one({"finance_id": finance["finance_id"]}, {"_id": 0})
    return created

@api_router.delete("/finances/{finance_id}")
async def delete_finance(finance_id: str, user: dict = Depends(get_current_user)):
    result = await db.finances.delete_one(
        {"finance_id": finance_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"message": "Registro eliminado"}

@api_router.get("/finances/summary")
async def get_finance_summary(user: dict = Depends(get_current_user)):
    finances = await db.finances.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).to_list(5000)
    
    total_income = sum(f["amount"] for f in finances if f.get("transaction_type") == "ingreso")
    total_expense = sum(f["amount"] for f in finances if f.get("transaction_type") == "gasto")
    
    categories = {}
    for f in finances:
        cat = f.get("category", "otros")
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += f.get("amount", 0)
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "profit": total_income - total_expense,
        "categories": categories,
        "transaction_count": len(finances)
    }

# --- Dashboard ---

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    
    total_animals = await db.animals.count_documents({"user_id": uid, "status": "activo"})
    total_cows = await db.animals.count_documents({"user_id": uid, "status": "activo", "animal_type": "vaca"})
    total_bulls = await db.animals.count_documents({"user_id": uid, "status": "activo", "animal_type": "toro"})
    total_calves = await db.animals.count_documents({"user_id": uid, "status": "activo", "animal_type": "ternero"})
    total_heifers = await db.animals.count_documents({"user_id": uid, "status": "activo", "animal_type": "novilla"})
    total_sold = await db.animals.count_documents({"user_id": uid, "status": "vendido"})
    total_dead = await db.animals.count_documents({"user_id": uid, "status": "muerto"})
    
    total_paddocks = await db.paddocks.count_documents({"user_id": uid})
    active_paddocks = await db.paddocks.count_documents({"user_id": uid, "status": "activo"})
    resting_paddocks = await db.paddocks.count_documents({"user_id": uid, "status": "en_descanso"})
    
    # Finance summary
    finances = await db.finances.find({"user_id": uid}, {"_id": 0}).to_list(5000)
    total_income = sum(f["amount"] for f in finances if f.get("transaction_type") == "ingreso")
    total_expense = sum(f["amount"] for f in finances if f.get("transaction_type") == "gasto")
    
    # Recent health alerts
    recent_health = await db.health_records.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    # Average weight
    animals_with_weight = await db.animals.find(
        {"user_id": uid, "status": "activo", "weight": {"$gt": 0}}, {"_id": 0, "weight": 1}
    ).to_list(10000)
    avg_weight = 0
    if animals_with_weight:
        avg_weight = sum(a["weight"] for a in animals_with_weight) / len(animals_with_weight)
    
    # Paddock grass status summary
    paddocks = await db.paddocks.find({"user_id": uid}, {"_id": 0}).to_list(100)
    grass_good = sum(1 for p in paddocks if p.get("grass_status") == "bueno")
    grass_regular = sum(1 for p in paddocks if p.get("grass_status") == "regular")
    grass_bad = sum(1 for p in paddocks if p.get("grass_status") == "malo")
    
    return {
        "animals": {
            "total": total_animals,
            "cows": total_cows,
            "bulls": total_bulls,
            "calves": total_calves,
            "heifers": total_heifers,
            "sold": total_sold,
            "dead": total_dead,
            "avg_weight": round(avg_weight, 1)
        },
        "paddocks": {
            "total": total_paddocks,
            "active": active_paddocks,
            "resting": resting_paddocks,
            "grass_good": grass_good,
            "grass_regular": grass_regular,
            "grass_bad": grass_bad
        },
        "finance": {
            "total_income": total_income,
            "total_expense": total_expense,
            "profit": total_income - total_expense
        },
        "recent_health": recent_health
    }

# --- Smart Alerts (Rule-based, NO AI, zero cost) ---

@api_router.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    alerts = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_dt = datetime.now(timezone.utc)

    # 1. Vaccination pending (last vaccine > 180 days)
    animals = await db.animals.find(
        {"user_id": uid, "status": "activo"}, {"_id": 0}
    ).to_list(10000)

    for a in animals:
        last_vac = a.get("last_vaccination_date", "")
        if last_vac:
            try:
                vac_dt = datetime.fromisoformat(last_vac).replace(tzinfo=timezone.utc)
                days_since = (today_dt - vac_dt).days
                if days_since > 180:
                    alerts.append({
                        "alert_id": f"vac_{a['animal_id']}",
                        "type": "vacunacion_pendiente",
                        "severity": "alta" if days_since > 365 else "media",
                        "title": f"Vacunación pendiente: {a['name']}",
                        "description": f"Última vacuna hace {days_since} días (#{a.get('tag_id', '')})",
                        "animal_id": a["animal_id"],
                        "animal_name": a["name"],
                        "date": today,
                    })
            except (ValueError, TypeError):
                pass
        else:
            # Check health records for last vaccine
            last_vac_rec = await db.health_records.find_one(
                {"animal_id": a["animal_id"], "user_id": uid, "record_type": "vacuna"},
                {"_id": 0}, sort=[("date", -1)]
            )
            if last_vac_rec:
                try:
                    vac_dt = datetime.fromisoformat(last_vac_rec["date"]).replace(tzinfo=timezone.utc)
                    days_since = (today_dt - vac_dt).days
                    if days_since > 180:
                        alerts.append({
                            "alert_id": f"vac_{a['animal_id']}",
                            "type": "vacunacion_pendiente",
                            "severity": "alta" if days_since > 365 else "media",
                            "title": f"Vacunación pendiente: {a['name']}",
                            "description": f"Última vacuna hace {days_since} días",
                            "animal_id": a["animal_id"],
                            "animal_name": a["name"],
                            "date": today,
                        })
                except (ValueError, TypeError):
                    pass

    # 2. Expected calving within 30 days
    for a in animals:
        calving = a.get("expected_calving_date", "")
        if calving:
            try:
                calv_dt = datetime.fromisoformat(calving).replace(tzinfo=timezone.utc)
                days_until = (calv_dt - today_dt).days
                if 0 <= days_until <= 30:
                    alerts.append({
                        "alert_id": f"parto_{a['animal_id']}",
                        "type": "parto_proximo",
                        "severity": "alta" if days_until <= 7 else "media",
                        "title": f"Parto próximo: {a['name']}",
                        "description": f"Parto esperado en {days_until} días ({calving})",
                        "animal_id": a["animal_id"],
                        "animal_name": a["name"],
                        "date": calving,
                    })
                elif days_until < 0 and days_until >= -14:
                    alerts.append({
                        "alert_id": f"parto_atrasado_{a['animal_id']}",
                        "type": "parto_proximo",
                        "severity": "alta",
                        "title": f"¡Parto atrasado!: {a['name']}",
                        "description": f"Fecha esperada fue {calving} ({abs(days_until)} días atrás)",
                        "animal_id": a["animal_id"],
                        "animal_name": a["name"],
                        "date": calving,
                    })
            except (ValueError, TypeError):
                pass

    # 3. Paddock overcrowded
    paddocks = await db.paddocks.find({"user_id": uid}, {"_id": 0}).to_list(100)
    for p in paddocks:
        count = await db.animals.count_documents(
            {"paddock_id": p["paddock_id"], "user_id": uid, "status": "activo"}
        )
        cap = p.get("capacity", 0)
        if cap > 0 and count > cap:
            alerts.append({
                "alert_id": f"saturado_{p['paddock_id']}",
                "type": "potrero_saturado",
                "severity": "alta",
                "title": f"Potrero saturado: {p['name']}",
                "description": f"{count} animales / capacidad {cap}",
                "paddock_id": p["paddock_id"],
                "date": today,
            })

    # 4. Bad grass status
    for p in paddocks:
        if p.get("grass_status") == "malo":
            alerts.append({
                "alert_id": f"pasto_{p['paddock_id']}",
                "type": "pasto_deteriorado",
                "severity": "media",
                "title": f"Pasto deteriorado: {p['name']}",
                "description": f"El pasto en {p['name']} necesita atención ({p.get('grass_type', '')})",
                "paddock_id": p["paddock_id"],
                "date": today,
            })

    # 5. No health check in > 90 days
    for a in animals:
        last_health = await db.health_records.find_one(
            {"animal_id": a["animal_id"], "user_id": uid},
            {"_id": 0}, sort=[("date", -1)]
        )
        if last_health:
            try:
                h_dt = datetime.fromisoformat(last_health["date"]).replace(tzinfo=timezone.utc)
                days_since = (today_dt - h_dt).days
                if days_since > 90:
                    alerts.append({
                        "alert_id": f"revision_{a['animal_id']}",
                        "type": "revision_pendiente",
                        "severity": "baja",
                        "title": f"Revisión pendiente: {a['name']}",
                        "description": f"Sin revisión hace {days_since} días",
                        "animal_id": a["animal_id"],
                        "animal_name": a["name"],
                        "date": today,
                    })
            except (ValueError, TypeError):
                pass

    # Sort by severity
    severity_order = {"alta": 0, "media": 1, "baja": 2}
    alerts.sort(key=lambda x: severity_order.get(x.get("severity", "baja"), 3))

    return {"alerts": alerts, "count": len(alerts)}


# --- NDVI / Paddock Health Data ---

@api_router.get("/ndvi")
async def get_ndvi_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    paddocks = await db.paddocks.find({"user_id": uid}, {"_id": 0}).to_list(100)

    ndvi_data = []
    for p in paddocks:
        count = await db.animals.count_documents(
            {"paddock_id": p["paddock_id"], "user_id": uid, "status": "activo"}
        )
        grass = p.get("grass_status", "bueno")
        # Simulate NDVI value based on grass status
        ndvi_value = {"bueno": 0.75, "regular": 0.45, "malo": 0.2}.get(grass, 0.5)
        # Capacity usage
        cap = p.get("capacity", 0)
        usage = (count / cap * 100) if cap > 0 else 0

        ndvi_data.append({
            "paddock_id": p["paddock_id"],
            "name": p["name"],
            "center_lat": p.get("center_lat", 0),
            "center_lng": p.get("center_lng", 0),
            "area_hectares": p.get("area_hectares", 0),
            "grass_status": grass,
            "grass_type": p.get("grass_type", ""),
            "ndvi_value": ndvi_value,
            "animal_count": count,
            "capacity": cap,
            "usage_percent": round(usage, 1),
            "status": p.get("status", "activo"),
            "recommendation": _get_ndvi_recommendation(grass, usage, p.get("status", "")),
        })

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


# --- Offline Sync ---

@api_router.post("/sync")
async def sync_offline_data(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    uid = user["user_id"]
    results = {"created": 0, "errors": []}

    operations = body.get("operations", [])
    for op in operations:
        try:
            op_type = op.get("type")  # create_animal, create_paddock, create_finance, etc.
            data = op.get("data", {})

            if op_type == "create_animal":
                animal = {
                    "animal_id": f"animal_{uuid.uuid4().hex[:12]}",
                    "user_id": uid,
                    **data,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.animals.insert_one(animal)
                results["created"] += 1

            elif op_type == "create_paddock":
                paddock = {
                    "paddock_id": f"paddock_{uuid.uuid4().hex[:12]}",
                    "user_id": uid,
                    **data,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.paddocks.insert_one(paddock)
                results["created"] += 1

            elif op_type == "create_finance":
                finance = {
                    "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
                    "user_id": uid,
                    **data,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.finances.insert_one(finance)
                results["created"] += 1

            elif op_type == "create_health":
                record = {
                    "record_id": f"health_{uuid.uuid4().hex[:12]}",
                    "user_id": uid,
                    **data,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.health_records.insert_one(record)
                results["created"] += 1

        except Exception as e:
            results["errors"].append({"op": op_type, "error": str(e)})

    return results

# --- Seed Data ---

@api_router.post("/seed")
async def seed_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    
    # Check if already seeded
    existing = await db.animals.count_documents({"user_id": uid})
    if existing > 0:
        return {"message": "Datos ya existentes", "seeded": False}
    
    # Create paddocks
    paddocks_data = [
        {"name": "Potrero Norte", "area_hectares": 15, "grass_type": "Brachiaria", "grass_status": "bueno", "capacity": 20, "center_lat": 4.6097, "center_lng": -74.0817, "status": "activo"},
        {"name": "Potrero Sur", "area_hectares": 12, "grass_type": "Estrella", "grass_status": "regular", "capacity": 15, "center_lat": 4.6080, "center_lng": -74.0830, "status": "activo"},
        {"name": "Potrero Central", "area_hectares": 20, "grass_type": "Guinea", "grass_status": "bueno", "capacity": 25, "center_lat": 4.6090, "center_lng": -74.0800, "status": "en_descanso"},
    ]
    
    paddock_ids = []
    for pd in paddocks_data:
        pid = f"paddock_{uuid.uuid4().hex[:12]}"
        await db.paddocks.insert_one({
            "paddock_id": pid,
            "user_id": uid,
            **pd,
            "coordinates": [],
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        paddock_ids.append(pid)
    
    # Create animals
    animals_data = [
        {"name": "Lola", "tag_id": "A001", "breed": "Angus", "animal_type": "vaca", "birth_date": "2021-03-15", "weight": 450, "sex": "hembra", "paddock_id": paddock_ids[0], "expected_calving_date": "2026-03-20", "last_breeding_date": "2025-06-15", "last_vaccination_date": "2025-01-15"},
        {"name": "Toro Negro", "tag_id": "A002", "breed": "Brahman", "animal_type": "toro", "birth_date": "2020-06-20", "weight": 680, "sex": "macho", "paddock_id": paddock_ids[0], "expected_calving_date": "", "last_breeding_date": "", "last_vaccination_date": "2025-08-10"},
        {"name": "Manchas", "tag_id": "A003", "breed": "Holstein", "animal_type": "vaca", "birth_date": "2022-01-10", "weight": 420, "sex": "hembra", "paddock_id": paddock_ids[1], "expected_calving_date": "2026-04-05", "last_breeding_date": "2025-07-01", "last_vaccination_date": "2024-06-20"},
        {"name": "Ternero Luna", "tag_id": "A004", "breed": "Angus", "animal_type": "ternero", "birth_date": "2024-08-05", "weight": 120, "sex": "hembra", "paddock_id": paddock_ids[0], "expected_calving_date": "", "last_breeding_date": "", "last_vaccination_date": "2024-12-10"},
        {"name": "Valentina", "tag_id": "A005", "breed": "Simmental", "animal_type": "novilla", "birth_date": "2023-02-14", "weight": 320, "sex": "hembra", "paddock_id": paddock_ids[1], "expected_calving_date": "", "last_breeding_date": "", "last_vaccination_date": "2025-05-01"},
        {"name": "El Rey", "tag_id": "A006", "breed": "Charolais", "animal_type": "toro", "birth_date": "2019-11-25", "weight": 750, "sex": "macho", "paddock_id": paddock_ids[0], "expected_calving_date": "", "last_breeding_date": "", "last_vaccination_date": "2025-03-15"},
        {"name": "Estrella", "tag_id": "A007", "breed": "Jersey", "animal_type": "vaca", "birth_date": "2021-07-08", "weight": 380, "sex": "hembra", "paddock_id": paddock_ids[1], "expected_calving_date": "2026-03-10", "last_breeding_date": "2025-06-05", "last_vaccination_date": "2025-01-20"},
        {"name": "Becerro Sol", "tag_id": "A008", "breed": "Brahman", "animal_type": "ternero", "birth_date": "2025-01-20", "weight": 80, "sex": "macho", "paddock_id": paddock_ids[0], "expected_calving_date": "", "last_breeding_date": "", "last_vaccination_date": "2025-02-15"},
    ]
    
    animal_ids = []
    for ad in animals_data:
        aid = f"animal_{uuid.uuid4().hex[:12]}"
        await db.animals.insert_one({
            "animal_id": aid,
            "user_id": uid,
            **ad,
            "status": "activo",
            "notes": "",
            "mother_id": "",
            "father_id": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        animal_ids.append(aid)
    
    # Create health records
    health_data = [
        {"animal_id": animal_ids[0], "record_type": "vacuna", "description": "Fiebre aftosa - dosis anual", "date": "2025-01-15", "veterinarian": "Dr. García"},
        {"animal_id": animal_ids[1], "record_type": "revision", "description": "Revisión general - buen estado", "date": "2025-02-01", "veterinarian": "Dr. García"},
        {"animal_id": animal_ids[2], "record_type": "tratamiento", "description": "Desparasitación interna", "date": "2025-01-20", "veterinarian": "Dr. López"},
        {"animal_id": animal_ids[3], "record_type": "vacuna", "description": "Clostridial - primera dosis", "date": "2024-12-10", "veterinarian": "Dr. García"},
    ]
    for hd in health_data:
        await db.health_records.insert_one({
            "record_id": f"health_{uuid.uuid4().hex[:12]}",
            "user_id": uid,
            **hd,
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create finance records
    finance_data = [
        {"transaction_type": "ingreso", "category": "venta_ganado", "amount": 2500000, "description": "Venta de 2 novillos", "date": "2025-01-10"},
        {"transaction_type": "gasto", "category": "compra_alimento", "amount": 450000, "description": "Sal mineralizada y concentrado", "date": "2025-01-15"},
        {"transaction_type": "gasto", "category": "veterinario", "amount": 180000, "description": "Vacunación completa del hato", "date": "2025-01-20"},
        {"transaction_type": "ingreso", "category": "venta_leche", "amount": 800000, "description": "Venta de leche mensual", "date": "2025-02-01"},
        {"transaction_type": "gasto", "category": "mantenimiento", "amount": 350000, "description": "Reparación cercas potrero norte", "date": "2025-02-05"},
    ]
    for fd in finance_data:
        await db.finances.insert_one({
            "finance_id": f"fin_{uuid.uuid4().hex[:12]}",
            "user_id": uid,
            **fd,
            "animal_id": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Datos de ejemplo creados exitosamente", "seeded": True}

# --- Photo Upload (base64) ---

class PhotoUpload(BaseModel):
    animal_id: str
    photo_base64: str  # base64 encoded image
    description: str = ""

@api_router.post("/animals/{animal_id}/photo")
@limiter.limit("20/minute")
async def upload_animal_photo(request: Request, animal_id: str, data: PhotoUpload, user: dict = Depends(get_current_user)):
    animal = await db.animals.find_one(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    
    # Validate base64 size (max 5MB)
    if len(data.photo_base64) > 5 * 1024 * 1024 * 1.37:  # base64 overhead
        raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx 5MB)")
    
    photo = {
        "photo_id": f"photo_{uuid.uuid4().hex[:12]}",
        "animal_id": animal_id,
        "user_id": user["user_id"],
        "photo_base64": data.photo_base64,
        "description": sanitize_string(data.description, 200),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.animal_photos.insert_one(photo)
    await log_audit(user["user_id"], "upload_photo", "animal", animal_id)
    return {"photo_id": photo["photo_id"], "message": "Foto subida exitosamente"}

@api_router.get("/animals/{animal_id}/photos")
async def get_animal_photos(animal_id: str, user: dict = Depends(get_current_user)):
    photos = await db.animal_photos.find(
        {"animal_id": animal_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return photos

@api_router.delete("/animals/{animal_id}/photos/{photo_id}")
async def delete_animal_photo(animal_id: str, photo_id: str, user: dict = Depends(get_current_user)):
    result = await db.animal_photos.delete_one(
        {"photo_id": photo_id, "animal_id": animal_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    await log_audit(user["user_id"], "delete_photo", "animal", animal_id)
    return {"message": "Foto eliminada"}

# --- CSV Export ---

@api_router.get("/export/animals")
async def export_animals_csv(user: dict = Depends(get_current_user)):
    animals = await db.animals.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Nombre", "Arete", "Tipo", "Raza", "Sexo", "Peso (kg)", "Estado", "Fecha Nacimiento", "Parto Esperado", "Última Vacuna"])
    for a in animals:
        writer.writerow([
            a.get("animal_id", ""), a.get("name", ""), a.get("tag_id", ""),
            a.get("animal_type", ""), a.get("breed", ""), a.get("sex", ""),
            a.get("weight", 0), a.get("status", ""), a.get("birth_date", ""),
            a.get("expected_calving_date", ""), a.get("last_vaccination_date", "")
        ])
    
    output.seek(0)
    await log_audit(user["user_id"], "export_csv", "animals")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agroflow_ganado.csv"}
    )

@api_router.get("/export/finances")
async def export_finances_csv(user: dict = Depends(get_current_user)):
    finances = await db.finances.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Tipo", "Categoría", "Monto", "Descripción", "Fecha"])
    for f in finances:
        writer.writerow([
            f.get("finance_id", ""), f.get("transaction_type", ""),
            f.get("category", ""), f.get("amount", 0),
            f.get("description", ""), f.get("date", "")
        ])
    
    output.seek(0)
    await log_audit(user["user_id"], "export_csv", "finances")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agroflow_finanzas.csv"}
    )

# --- Audit Logs ---

@api_router.get("/audit-logs")
async def get_audit_logs(user: dict = Depends(get_current_user)):
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Solo propietarios pueden ver logs de auditoría")
    logs = await db.audit_logs.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return logs

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
