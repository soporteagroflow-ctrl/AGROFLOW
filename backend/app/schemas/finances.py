from pydantic import BaseModel


class FinanceCreate(BaseModel):
    transaction_type: str
    category: str
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
