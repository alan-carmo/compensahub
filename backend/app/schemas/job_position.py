from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.job_position import LevelEnum

class JobPositionCreate(BaseModel):
    department_id: int
    title: str
    level: LevelEnum
    description: Optional[str] = None
    is_active: bool = True

class JobPositionUpdate(BaseModel):
    department_id: Optional[int] = None
    title: Optional[str] = None
    level: Optional[LevelEnum] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class JobPositionResponse(BaseModel):
    id: int
    department_id: int
    title: str
    level: LevelEnum
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
