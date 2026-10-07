# Importação de módulos do sistema operacional para leitura de variáveis de ambiente
import os
# Importação de funções de criação de engine e gerenciamento de sessões do SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lê a URL do banco de dados a partir da variável de ambiente DATABASE_URL ou usa a string padrão do MySQL no Docker
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://user:password@localhost:3306/compensahub"
)

try:
    # Tenta criar a engine de conexão com o MySQL com um timeout baixo de 2 segundos para rápida inicialização
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"connect_timeout": 2})
    # Tenta efetuar uma conexão de teste para validar se o MySQL está ativo
    with engine.connect() as connection:
        pass
except Exception:
    # Caso o MySQL não esteja rodando no Docker local, utiliza SQLite como fallback resiliente automático
    SQLITE_URL = "sqlite:///./compensahub.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

# Configura a sessão que o FastAPI vai usar para cada requisição
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para criar os nossos modelos do SQLAlchemy
Base = declarative_base()

# Função geradora que fornecerá uma sessão de banco de dados e a fechará ao final de cada requisição
def get_db():
    # Cria uma nova instância de sessão do banco de dados
    db = SessionLocal()
    try:
        # Entrega a sessão para o endpoint do FastAPI utilizar
        yield db
    finally:
        # Garante o fechamento seguro da sessão após o término da requisição
        db.close()
