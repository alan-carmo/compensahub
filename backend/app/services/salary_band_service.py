from sqlalchemy.orm import Session
from app.models.salary_band import SalaryBand
from app.models.job_position import JobPosition
from app.schemas.salary_band import SalaryBandCreate
from fastapi import HTTPException

def create_salary_band(db: Session, band_in: SalaryBandCreate):
    # REGRA DE NEGÓCIO 1: Validação de consistência da faixa
    if not (band_in.min_salary <= band_in.mid_salary <= band_in.max_salary):
        raise HTTPException(
            status_code=400, 
            detail="Valores inválidos: O min_salary deve ser menor que o mid_salary, e este menor que o max_salary."
        )
        
    # Verificar se o cargo existe
    pos = db.query(JobPosition).filter(JobPosition.id == band_in.position_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Job position not found")
        
    # REGRA DE NEGÓCIO 2: Versionamento (Desativar a atual se for cadastrar uma nova como vigente)
    if band_in.is_current:
        db.query(SalaryBand).filter(
            SalaryBand.position_id == band_in.position_id, 
            SalaryBand.is_current == True
        ).update({"is_current": False})
        
    new_band = SalaryBand(**band_in.model_dump())
    db.add(new_band)
    db.commit()
    db.refresh(new_band)
    return new_band

def get_salary_bands_by_position(db: Session, position_id: int):
    return db.query(SalaryBand).filter(SalaryBand.position_id == position_id).all()
