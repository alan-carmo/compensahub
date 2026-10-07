from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from app.models.employee import StatusEnum

class EmployeeCreate(BaseModel):
    full_name: str
    registration_number: str
    department_id: int
    position_id: int
    current_salary: float
    hire_date: date
    status: StatusEnum = StatusEnum.ACTIVE

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    registration_number: Optional[str] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    current_salary: Optional[float] = None
    hire_date: Optional[date] = None
    status: Optional[StatusEnum] = None

class EmployeeResponse(BaseModel):
    id: int
    full_name: str
    registration_number: str
    department_id: int
    position_id: int
    current_salary: float
    hire_date: date
    status: StatusEnum
    created_at: datetime
    updated_at: datetime
    
    # Nome do departamento e título do cargo anexados dinamicamente
    department_name: Optional[str] = None
    position_title: Optional[str] = None
    
    # Estes campos não existem na tabela do banco, mas a API calculará 
    # e enviará junto para facilitar a vida do front-end!
    compa_ratio: Optional[float] = None
    compa_ratio_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
