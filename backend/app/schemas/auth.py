from pydantic import BaseModel


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    role: str = "owner"
    farm_name: str = ""


class FirebaseTokenRequest(BaseModel):
    id_token: str


class UserUpdate(BaseModel):
    farm_name: str = ""
    role: str = ""
