from pydantic import BaseModel


class PaddockCreate(BaseModel):
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
