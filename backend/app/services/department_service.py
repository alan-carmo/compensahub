from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from fastapi import HTTPException

def create_department(db: Session, dept_in: DepartmentCreate):
    # Verifica se já existe departamento com esse nome
    db_dept = db.query(Department).filter(Department.name == dept_in.name).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department name already registered")
    
    new_dept = Department(**dept_in.model_dump())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

def get_departments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Department).offset(skip).limit(limit).all()

def get_department(db: Session, dept_id: int):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

def update_department(db: Session, dept_id: int, dept_in: DepartmentUpdate):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = dept_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != dept.name:
        existing = db.query(Department).filter(Department.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department name already registered")

    for field, value in update_data.items():
        setattr(dept, field, value)
        
    db.commit()
    db.refresh(dept)
    return dept

def delete_department(db: Session, dept_id: int):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(dept)
    db.commit()
    return {"detail": "Department deleted successfully"}
