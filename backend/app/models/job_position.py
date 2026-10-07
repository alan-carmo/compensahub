# Importações de colunas, chave estrangeira e enumerações do SQLAlchemy
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLAlchemyEnum
# Importação do suporte a relacionamentos ORM
from sqlalchemy.orm import relationship
# Importação de classe para manipulação de data e hora
from datetime import datetime
# Importação da biblioteca nativa de enumerações em Python
import enum
# Importação da classe base declarativa do banco de dados
from app.database import Base

# Enumeração dos níveis de senioridade padrão de mercado utilizados em cargos
class LevelEnum(str, enum.Enum):
    JUNIOR = "JUNIOR"           # Nível Júnior (Início de carreira)
    MID = "MID"                 # Nível Pleno / Mid (Profissional pleno)
    SENIOR = "SENIOR"           # Nível Sênior (Profissional especialista / sênior)
    COORDINATOR = "COORDINATOR" # Nível Coordenador (Liderança tática)
    MANAGER = "MANAGER"         # Nível Gerente (Liderança gerencial)
    DIRECTOR = "DIRECTOR"       # Nível Diretor (Liderança executiva)

# Modelo de dados da tabela 'job_positions' (Cargos e Funções)
class JobPosition(Base):
    # Nome da tabela correspondente no banco de dados MySQL
    __tablename__ = "job_positions"

    # Chave primária autoincrementável do cargo
    id = Column(Integer, primary_key=True, index=True)
    # Chave estrangeira que conecta o cargo ao seu departamento de origem
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    # Título do cargo (ex: Desenvolvedor Full Stack, Gerente de RH)
    title = Column(String(150), nullable=False)
    # Nível hierárquico validado pelo Enum (JUNIOR, MID, SENIOR, etc)
    level = Column(SQLAlchemyEnum(LevelEnum), nullable=False)
    # Descrição detalhada das responsabilidades e requisitos do cargo
    description = Column(Text, nullable=True)
    # Status de atividade do cargo (True para Ativo, False para Inativo)
    is_active = Column(Boolean, default=True)
    
    # Data de criação do registro no banco
    created_at = Column(DateTime, default=datetime.utcnow)
    # Data da última atualização dos dados do cargo
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento que conecta o cargo de volta ao departamento pai
    department = relationship("Department", back_populates="job_positions")
    # Relacionamento com as faixas salariais históricas e atuais deste cargo
    salary_bands = relationship("SalaryBand", back_populates="job_position")
    # Relacionamento com todos os colaboradores que ocupam este cargo
    employees = relationship("Employee", back_populates="job_position")
