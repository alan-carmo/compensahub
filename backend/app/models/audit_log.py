# Importação das colunas e tipos necessários do SQLAlchemy
from sqlalchemy import Column, Integer, String, Text, DateTime
# Importação da função de manipulação de datas do Python
from datetime import datetime
# Importação da classe base declarativa do banco de dados
from app.database import Base

# Modelo de dados da tabela 'audit_logs' para registro de trilha de auditoria e governança
class AuditLog(Base):
    # Nome da tabela no banco de dados MySQL / SQLite
    __tablename__ = "audit_logs"

    # Chave primária autoincrementada do registro de auditoria
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificador do usuário que realizou a ação (nulo se for sistema automático)
    user_id = Column(Integer, nullable=True, index=True)
    
    # Nome do usuário no momento da ação para histórico imutável
    user_name = Column(String(255), default="Administrador CompensaHub", nullable=False)

    # E-mail/Login do usuário que realizou a alteração
    user_email = Column(String(255), default="admin@compensahub.com", nullable=True)
    
    # Tipo da ação realizada (ex: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
    action = Column(String(50), nullable=False, index=True)
    
    # Entidade afetada (ex: 'EMPLOYEE', 'DEPARTMENT', 'JOB_POSITION', 'SALARY_BAND', 'SETTINGS')
    entity_type = Column(String(50), nullable=False, index=True)
    
    # Identificador do registro afetado na entidade
    entity_id = Column(Integer, nullable=True)
    
    # Descrição legível da alteração realizada
    description = Column(String(500), nullable=False)
    
    # Dados no formato JSON string de como o registro estava ANTES da alteração
    old_values = Column(Text, nullable=True)
    
    # Dados no formato JSON string de como o registro ficou DEPOIS da alteração
    new_values = Column(Text, nullable=True)
    
    # Data e hora local em que a ação ocorreu (utiliza datetime.now para bater exatamente com a hora local do sistema)
    created_at = Column(DateTime, default=datetime.now, nullable=False, index=True)
