from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.services import department_service

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])

@router.post("/", response_model=DepartmentResponse, status_code=201)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    """Cria um novo departamento"""
    return department_service.create_department(db=db, dept_in=dept_in)

@router.get("/", response_model=List[DepartmentResponse])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os departamentos"""
    return department_service.get_departments(db=db, skip=skip, limit=limit)

@router.get("/{dept_id}", response_model=DepartmentResponse)
def read_department(dept_id: int, db: Session = Depends(get_db)):
    """Busca um departamento pelo ID"""
    return department_service.get_department(db=db, dept_id=dept_id)

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, dept_in: DepartmentUpdate, db: Session = Depends(get_db)):
    """Atualiza dados de um departamento"""
    return department_service.update_department(db=db, dept_id=dept_id, dept_in=dept_in)

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    """Remove um departamento"""
    return department_service.delete_department(db=db, dept_id=dept_id)
