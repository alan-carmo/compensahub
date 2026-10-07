# Importação das classes necessárias do SQLAlchemy para definir colunas e tipos de dados no banco de dados
from sqlalchemy import Column, Integer, String, Boolean, DateTime
# Importação de suporte a relacionamentos entre tabelas (ORM)
from sqlalchemy.orm import relationship
# Importação para capturar a data e hora atual do sistema
from datetime import datetime
# Importação da classe Base configurada no banco de dados
from app.database import Base

# Definição do modelo de dados da tabela 'departments' (Departamentos)
class Department(Base):
    # Nome da tabela no banco de dados MySQL
    __tablename__ = "departments"

    # Chave primária autoincrementável do departamento
    id = Column(Integer, primary_key=True, index=True)
    # Nome do departamento (único, obrigatório e indexado para buscas rápidas)
    name = Column(String(100), unique=True, nullable=False, index=True)
    # Código do Centro de Custo (ex: CC-4001), opcional para controle financeiro
    cost_center = Column(String(50), nullable=True)
    # Indicador se o departamento está ativo (True) ou inativo (False)
    is_active = Column(Boolean, default=True)
    # Data e hora exatas da criação do registro no sistema
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento bidirecional com os cargos pertencentes a este departamento
    job_positions = relationship("JobPosition", back_populates="department")
    # Relacionamento bidirecional com os colaboradores alocados neste departamento
    employees = relationship("Employee", back_populates="department")
