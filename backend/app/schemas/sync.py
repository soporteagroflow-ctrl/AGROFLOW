"""Schemas for the offline-sync endpoint.

Each operation must carry a validated payload (we reuse the existing
per-domain Create schemas) so that a client can never inject arbitrary
fields such as ``user_id`` into a document.
"""

from typing import List, Literal, Union

from pydantic import BaseModel, Field

from app.schemas.animals import AnimalCreate, HealthRecordCreate
from app.schemas.finances import FinanceCreate
from app.schemas.paddocks import PaddockCreate


class CreateAnimalOp(BaseModel):
    type: Literal["create_animal"]
    data: AnimalCreate


class CreatePaddockOp(BaseModel):
    type: Literal["create_paddock"]
    data: PaddockCreate


class CreateFinanceOp(BaseModel):
    type: Literal["create_finance"]
    data: FinanceCreate


class CreateHealthOp(BaseModel):
    type: Literal["create_health"]
    data: HealthRecordCreate
    animal_id: str = ""


SyncOperation = Union[
    CreateAnimalOp,
    CreatePaddockOp,
    CreateFinanceOp,
    CreateHealthOp,
]


class SyncRequest(BaseModel):
    operations: List[SyncOperation] = Field(default_factory=list, max_length=500)
