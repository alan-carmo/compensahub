# Importação da sessão de banco de dados do SQLAlchemy
from sqlalchemy.orm import Session
# Importação dos modelos necessários para validação e busca de dados
from app.models.employee import Employee, StatusEnum
from app.models.department import Department
from app.models.job_position import JobPosition
from app.models.salary_band import SalaryBand
# Importação dos schemas Pydantic para criação e atualização do colaborador
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
# Importação do serviço de gravação de trilha de auditoria
from app.services.audit_service import register_log
# Importação do manipulador de exceções HTTP do FastAPI
from fastapi import HTTPException

# Helper para compor um dicionário legível de atributos do colaborador para auditoria
def _build_audit_dict(db: Session, emp: Employee) -> dict:
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp.department_id else None
    pos = db.query(JobPosition).filter(JobPosition.id == emp.position_id).first() if emp.position_id else None
    
    return {
        "full_name": emp.full_name,
        "registration_number": emp.registration_number,
        "department_name": dept.name if dept else f"ID #{emp.department_id}",
        "position_title": pos.title if pos else f"ID #{emp.position_id}",
        "current_salary": float(emp.current_salary),
        "status": emp.status.value if hasattr(emp.status, "value") else str(emp.status),
        "hire_date": str(emp.hire_date) if emp.hire_date else None
    }

# Função responsável por calcular o indicador Compa-Ratio (Índice de Comparação Salarial com o Mercado)
def calculate_compa_ratio(salary: float, mid_salary: float) -> dict:
    if not mid_salary or mid_salary == 0:
        return {"ratio": 0.0, "status": "Sem Referência"}
        
    ratio = (float(salary) / float(mid_salary)) * 100
    ratio = round(ratio, 1)
    
    if ratio < 80.0:
        status = "CRÍTICO (Risco de saída)"
    elif ratio < 95.0:
        status = "ABAIXO (Abaixo do mercado)"
    elif ratio <= 105.0:
        status = "ADEQUADO (Dentro da faixa)"
    elif ratio <= 120.0:
        status = "ACIMA (Avaliar promoção)"
    else:
        status = "EXCEDE (Anomalia Salarial)"
        
    return {"ratio": ratio, "status": status}

# Função auxiliar que calcula e anexa Compa-Ratio, Nome do Departamento e Título do Cargo ao objeto do funcionário
def append_compa_ratio(db: Session, employee: Employee):
    dept = db.query(Department).filter(Department.id == employee.department_id).first()
    employee.department_name = dept.name if dept else None

    pos = db.query(JobPosition).filter(JobPosition.id == employee.position_id).first()
    employee.position_title = pos.title if pos else None

    active_band = db.query(SalaryBand).filter(
        SalaryBand.position_id == employee.position_id,
        SalaryBand.is_current == True
    ).first()
    
    if active_band:
        cr_data = calculate_compa_ratio(employee.current_salary, active_band.mid_salary)
        employee.compa_ratio = cr_data["ratio"]
        employee.compa_ratio_status = cr_data["status"]
    else:
        employee.compa_ratio = None
        employee.compa_ratio_status = "Sem faixa ativa"
        
    return employee

# Serviço para criação de um novo colaborador no banco de dados
def create_employee(db: Session, emp_in: EmployeeCreate):
    if not db.query(Department).filter(Department.id == emp_in.department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")
        
    if not db.query(JobPosition).filter(JobPosition.id == emp_in.position_id).first():
        raise HTTPException(status_code=404, detail="Job position not found")
        
    if db.query(Employee).filter(Employee.registration_number == emp_in.registration_number).first():
        raise HTTPException(status_code=400, detail="Registration number already exists")

    new_emp = Employee(**emp_in.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    
    # Registra a ação na trilha de auditoria e governança com nomes legíveis
    audit_new = _build_audit_dict(db, new_emp)
    register_log(
        db=db,
        action="CREATE",
        entity_type="EMPLOYEE",
        entity_id=new_emp.id,
        description=f"Cadastrou o colaborador {new_emp.full_name} ({new_emp.registration_number}) com salário R$ {new_emp.current_salary:,.2f}",
        new_values=audit_new
    )

    return append_compa_ratio(db, new_emp)

# Serviço para listagem de colaboradores cadastrados
def get_employees(db: Session, skip: int = 0, limit: int = 500):
    employees = db.query(Employee).offset(skip).limit(limit).all()
    for emp in employees:
        append_compa_ratio(db, emp)
    return employees

# Serviço para atualização dos dados de um colaborador cadastrado
def update_employee(db: Session, emp_id: int, emp_in: EmployeeUpdate):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Obtém dicionário detalhado com valores legíveis antes da alteração
    old_values = _build_audit_dict(db, emp)

    update_data = emp_in.model_dump(exclude_unset=True)

    if "department_id" in update_data and update_data["department_id"] is not None:
        if not db.query(Department).filter(Department.id == update_data["department_id"]).first():
            raise HTTPException(status_code=404, detail="Department not found")

    if "position_id" in update_data and update_data["position_id"] is not None:
        if not db.query(JobPosition).filter(JobPosition.id == update_data["position_id"]).first():
            raise HTTPException(status_code=404, detail="Job position not found")

    if "registration_number" in update_data and update_data["registration_number"] != emp.registration_number:
        if db.query(Employee).filter(Employee.registration_number == update_data["registration_number"]).first():
            raise HTTPException(status_code=400, detail="Registration number already exists")

    # Aplica as alterações no modelo
    for field, value in update_data.items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)

    # Obtém dicionário detalhado com valores legíveis após a alteração
    new_values = _build_audit_dict(db, emp)

    # Registra a alteração na trilha de auditoria
    register_log(
        db=db,
        action="UPDATE",
        entity_type="EMPLOYEE",
        entity_id=emp.id,
        description=f"Atualizou cadastro do colaborador {emp.full_name} ({emp.registration_number})",
        old_values=old_values,
        new_values=new_values
    )

    return append_compa_ratio(db, emp)

# Serviço para exclusão de um colaborador do sistema
def delete_employee(db: Session, emp_id: int):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    old_values = _build_audit_dict(db, emp)
    emp_name = emp.full_name
    emp_reg = emp.registration_number

    db.delete(emp)
    db.commit()

    register_log(
        db=db,
        action="DELETE",
        entity_type="EMPLOYEE",
        entity_id=emp_id,
        description=f"Excluiu o colaborador {emp_name} ({emp_reg}) do sistema",
        old_values=old_values
    )

    return {"detail": "Employee deleted successfully"}

# Serviço para popular 24 colaboradores para cada um dos 3 departamentos sem criar gerentes
def seed_72_employees(db: Session):
    from datetime import date

    first_names = [
        "Lucas", "Gabriel", "Matheus", "Guilherme", "Gustavo", "Felipe", "Rafael", "Bernardo",
        "Enzo", "Pedro", "Thiago", "Bruno", "Rodrigo", "Diego", "Leonardo", "Samuel",
        "Camila", "Juliana", "Mariana", "Beatriz", "Larissa", "Fernanda", "Patricia", "Aline",
        "Vanessa", "Leticia", "Rafaela", "Gabriela", "Jessica", "Amanda", "Carolina", "Bianca",
        "Carla", "Daniela", "Eduarda", "Isabela", "Luana", "Thais", "Vinicius", "Marcelo"
    ]

    last_names = [
        "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
        "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
        "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade"
    ]

    multipliers = [0.75, 0.82, 0.88, 0.92, 0.97, 1.00, 1.04, 1.10, 1.15, 1.25]

    dept_configs = [
        ("RH", "2024-02-15"),
        ("DEV", "2023-09-10"),
        ("MKT", "2024-01-20")
    ]

    new_objects = []
    depts = db.query(Department).all()

    for idx, dept in enumerate(depts):
        prefix, hire_date_str = dept_configs[idx % len(dept_configs)]
        all_positions = db.query(JobPosition).filter(JobPosition.department_id == dept.id).all()
        positions = [
            p for p in all_positions 
            if "MANAGER" not in str(p.level).upper() and "GERENTE" not in p.title.upper()
        ]
        if not positions:
            positions = all_positions

        for i in range(1, 25):
            reg_num = f"{prefix}-{i+10:03d}"
            existing = db.query(Employee).filter(Employee.registration_number == reg_num).first()
            if existing:
                continue

            pos = positions[(i - 1) % len(positions)]
            active_band = db.query(SalaryBand).filter(
                SalaryBand.position_id == pos.id,
                SalaryBand.is_current == True
            ).first()

            mid_sal = float(active_band.mid_salary) if active_band else 5000.0
            mult = multipliers[(i - 1) % len(multipliers)]
            current_salary = round(mid_sal * mult, 2)

            fname = first_names[(i * 3 + dept.id * 7) % len(first_names)]
            lname1 = last_names[(i * 5 + dept.id * 3) % len(last_names)]
            lname2 = last_names[(i * 2 + dept.id * 11) % len(last_names)]
            full_name = f"{fname} {lname1} {lname2}"

            new_emp = Employee(
                full_name=full_name,
                registration_number=reg_num,
                department_id=dept.id,
                position_id=pos.id,
                current_salary=current_salary,
                hire_date=date.fromisoformat(hire_date_str),
                status=StatusEnum.ACTIVE
            )
            new_objects.append(new_emp)

    if new_objects:
        db.add_all(new_objects)
        db.commit()

    return get_employees(db, limit=500)
