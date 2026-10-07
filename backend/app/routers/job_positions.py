from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.job_position import JobPositionCreate, JobPositionUpdate, JobPositionResponse
from app.services import job_position_service

router = APIRouter(prefix="/api/v1/positions", tags=["Job Positions"])

@router.post("/", response_model=JobPositionResponse, status_code=201)
def create_job_position(pos_in: JobPositionCreate, db: Session = Depends(get_db)):
    """Cria um novo cargo vinculado a um departamento"""
    return job_position_service.create_job_position(db=db, pos_in=pos_in)

@router.get("/", response_model=List[JobPositionResponse])
def read_job_positions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os cargos"""
    return job_position_service.get_job_positions(db=db, skip=skip, limit=limit)

@router.get("/{pos_id}", response_model=JobPositionResponse)
def read_job_position(pos_id: int, db: Session = Depends(get_db)):
    """Busca um cargo pelo ID"""
    return job_position_service.get_job_position(db=db, pos_id=pos_id)

@router.put("/{pos_id}", response_model=JobPositionResponse)
def update_job_position(pos_id: int, pos_in: JobPositionUpdate, db: Session = Depends(get_db)):
    """Atualiza dados de um cargo"""
    return job_position_service.update_job_position(db=db, pos_id=pos_id, pos_in=pos_in)

@router.delete("/{pos_id}")
def delete_job_position(pos_id: int, db: Session = Depends(get_db)):
    """Remove um cargo"""
    return job_position_service.delete_job_position(db=db, pos_id=pos_id)
