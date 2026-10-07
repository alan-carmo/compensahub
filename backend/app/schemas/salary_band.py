from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class SalaryBandCreate(BaseModel):
    position_id: int
    min_salary: float
    mid_salary: float
    max_salary: float
    effective_from: date
    effective_until: Optional[date] = None
    is_current: bool = True

class SalaryBandResponse(BaseModel):
    id: int
    position_id: int
    min_salary: float
    mid_salary: float
    max_salary: float
    effective_from: date
    effective_until: Optional[date] = None
    is_current: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
