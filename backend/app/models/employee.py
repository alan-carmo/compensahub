# Importação de estruturas de dados do banco pelo SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Date, Enum as SQLAlchemyEnum
# Importação de capacidades ORM para mapeamento objeto-relacional
from sqlalchemy.orm import relationship
# Importação para controle temporal de criação e alteração
from datetime import datetime
# Importação de suporte a enumerações
import enum
# Importação da classe Base configurada no banco de dados
from app.database import Base

# Enumeração dos possíveis status contratuais do colaborador no RH
class StatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"       # Colaborador ativo na empresa
    INACTIVE = "INACTIVE"   # Colaborador desligado / inativo
    ON_LEAVE = "ON_LEAVE"   # Colaborador em licença (Maternidade, INSS, Médica, etc)

# Modelo de dados da tabela 'employees' (Funcionários / Colaboradores)
class Employee(Base):
    # Nome da tabela no banco MySQL
    __tablename__ = "employees"

    # Chave primária autoincrementável do colaborador
    id = Column(Integer, primary_key=True, index=True)
    # Nome completo do funcionário
    full_name = Column(String(200), nullable=False)
    # Número de matrícula do funcionário (único e indexado para consulta rápida)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Chave estrangeira indicando o departamento onde o colaborador está alocado
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    # Chave estrangeira indicando o cargo exercido pelo colaborador
    position_id = Column(Integer, ForeignKey("job_positions.id"), nullable=False)
    
    # Salário mensal atual recebido pelo colaborador (usado no cálculo de Compa-Ratio)
    current_salary = Column(Numeric(10, 2), nullable=False)
    # Data de admissão do colaborador na empresa
    hire_date = Column(Date, nullable=False)
    # Status contratual do colaborador (ACTIVE por padrão)
    status = Column(SQLAlchemyEnum(StatusEnum), default=StatusEnum.ACTIVE, nullable=False)
    
    # Data e hora em que o funcionário foi cadastrado
    created_at = Column(DateTime, default=datetime.utcnow)
    # Data e hora em que os dados do funcionário foram alterados pela última vez
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento de volta com o Departamento
    department = relationship("Department", back_populates="employees")
    # Relacionamento de volta com o Cargo (JobPosition)
    job_position = relationship("JobPosition", back_populates="employees")
