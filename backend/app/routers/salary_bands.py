from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.salary_band import SalaryBandCreate, SalaryBandResponse
from app.services import salary_band_service

router = APIRouter(prefix="/api/v1/salary-bands", tags=["Salary Bands"])

@router.post("/", response_model=SalaryBandResponse, status_code=201)
def create_salary_band(band_in: SalaryBandCreate, db: Session = Depends(get_db)):
    """Cria uma nova faixa salarial para um cargo, validando os valores da faixa."""
    return salary_band_service.create_salary_band(db=db, band_in=band_in)

@router.get("/position/{position_id}", response_model=List[SalaryBandResponse])
def get_bands_for_position(position_id: int, db: Session = Depends(get_db)):
    """Busca todas as faixas salariais históricas e atuais de um determinado cargo."""
    return salary_band_service.get_salary_bands_by_position(db=db, position_id=position_id)
