# Importação das classes necessárias do SQLAlchemy para mapeamento de colunas e tipos
from sqlalchemy import Column, Integer, String, Boolean, DateTime
# Importação da função de geração de data e hora atual
from datetime import datetime
# Importação da classe base declarativa do banco de dados
from app.database import Base

# Modelo de dados da tabela 'users' para controle de usuários e autenticação no sistema
class User(Base):
    # Nome da tabela no banco de dados MySQL
    __tablename__ = "users"

    # Chave primária do usuário com incremento automático
    id = Column(Integer, primary_key=True, index=True)
    
    # Endereço de e-mail do usuário (utilizado como login principal e deve ser único)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Nome completo do colaborador ou administrador
    full_name = Column(String(255), nullable=False)
    
    # Hash seguro da senha codificado (nunca salvar senha em texto puro)
    hashed_password = Column(String(255), nullable=False)
    
    # Cargo/Papel do usuário no sistema (ex: 'ADMIN', 'GESTOR', 'ANALISTA')
    role = Column(String(50), default="ADMIN", nullable=False)
    
    # Indicador se a conta do usuário está ativa no sistema
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Registro da data e hora da criação do usuário
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
