from sqlalchemy.orm import Session
from app.models.job_position import JobPosition
from app.models.department import Department
from fastapi import HTTPException
from app.schemas.job_position import JobPositionCreate, JobPositionUpdate

def update_job_position(db: Session, pos_id: int, pos_in: JobPositionUpdate):
    pos = db.query(JobPosition).filter(JobPosition.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Job position not found")
    
    update_data = pos_in.model_dump(exclude_unset=True)
    if "department_id" in update_data and update_data["department_id"] is not None:
        dept = db.query(Department).filter(Department.id == update_data["department_id"]).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")

    for field, value in update_data.items():
        setattr(pos, field, value)
        
    db.commit()
    db.refresh(pos)
    return pos

def delete_job_position(db: Session, pos_id: int):
    pos = db.query(JobPosition).filter(JobPosition.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Job position not found")
    
    db.delete(pos)
    db.commit()
    return {"detail": "Job position deleted successfully"}

def create_job_position(db: Session, pos_in: JobPositionCreate):
    # Validar se o departamento realmente existe antes de criar o cargo
    dept = db.query(Department).filter(Department.id == pos_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    new_pos = JobPosition(**pos_in.model_dump())
    db.add(new_pos)
    db.commit()
    db.refresh(new_pos)
    return new_pos

def get_job_positions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(JobPosition).offset(skip).limit(limit).all()

def get_job_position(db: Session, pos_id: int):
    pos = db.query(JobPosition).filter(JobPosition.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Job position not found")
    return pos
