from pydantic import BaseModel


class AnimalCreate(BaseModel):
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
    expected_calving_date: str = ""
    last_breeding_date: str = ""
    last_vaccination_date: str = ""
    created_at: str = ""


class HealthRecordCreate(BaseModel):
    record_type: str
    description: str
    date: str = ""
    veterinarian: str = ""
    notes: str = ""


class WeightRecordCreate(BaseModel):
    weight: float
    date: str = ""
    notes: str = ""


class PhotoUpload(BaseModel):
    animal_id: str
    photo_base64: str
    description: str = ""
