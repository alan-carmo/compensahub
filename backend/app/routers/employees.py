from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.services import employee_service

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])

@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(emp_in: EmployeeCreate, db: Session = Depends(get_db)):
    """Contrata/cadastra um novo funcionário."""
    return employee_service.create_employee(db=db, emp_in=emp_in)

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os funcionários com o cálculo de Compa-Ratio já embutido."""
    return employee_service.get_employees(db=db, skip=skip, limit=limit)

@router.put("/{emp_id}", response_model=EmployeeResponse)
def update_employee(emp_id: int, emp_in: EmployeeUpdate, db: Session = Depends(get_db)):
    """Atualiza informações do funcionário (nome, matrícula, cargo, salário, etc)."""
    return employee_service.update_employee(db=db, emp_id=emp_id, emp_in=emp_in)

@router.get("/seed-72", response_model=List[EmployeeResponse])
@router.get("/seed-72/", response_model=List[EmployeeResponse])
@router.post("/seed-72", response_model=List[EmployeeResponse])
@router.post("/seed-72/", response_model=List[EmployeeResponse])
def seed_employees(db: Session = Depends(get_db)):
    """Popula 24 empregados para cada um dos 3 departamentos com variabilidade de Compa-Ratio (sem criar gerentes)."""
    return employee_service.seed_72_employees(db=db)

@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    """Remove um funcionário."""
    return employee_service.delete_employee(db=db, emp_id=emp_id)
