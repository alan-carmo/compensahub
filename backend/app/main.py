# Importação do framework FastAPI para criação da aplicação web e API RESTful
from fastapi import FastAPI
# Importação do middleware do CORS para liberar o acesso de diferentes origens/portas
from fastapi.middleware.cors import CORSMiddleware
# Importação de suporte a instruções SQL diretas para migração suave de tabelas
from sqlalchemy import text

# Importação da engine do banco e Base para criação automática de tabelas
from app.database import engine, Base, SessionLocal
# Importação explicita dos modelos para registro no SQLAlchemy sem sobrescrever a variável app
from app.models import settings as settings_model, user as user_model, audit_log as audit_log_model

# Inicialização da instância principal do aplicativo FastAPI com título e versão
app = FastAPI(title="CompensaHub API", version="1.0.0")

# Configuração de CORS (Cross-Origin Resource Sharing) para liberar acesso do Front-end React
app.add_middleware(
    CORSMiddleware,
    # Origens permitidas: aceita requisições vindas do Vite (http://localhost:5173)
    allow_origins=["http://localhost:5173"],
    # Permite envio de cookies e cabeçalhos de autenticação
    allow_credentials=True,
    # Libera todos os métodos HTTP (GET, POST, PUT, DELETE, etc)
    allow_methods=["*"],
    # Libera todos os cabeçalhos HTTP
    allow_headers=["*"],
)

# Cria automaticamente todas as tabelas no banco de dados caso não existam
Base.metadata.create_all(bind=engine)

# Garante a presença de colunas recém-adicionadas em tabelas existentes sem romper a execução
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(255) DEFAULT 'admin@compensahub.com'"))
        conn.commit()
    except Exception:
        # Se a coluna já existir no MySQL/SQLite, ignora silenciosamente
        pass

# Importação dos módulos de roteamento da aplicação
from app.routers import departments, job_positions, salary_bands, employees, settings as settings_router, auth, audit_logs
from app.routers.auth import ensure_initial_admin

# Inicializa o usuário administrador inicial no banco de dados
db_session = SessionLocal()
try:
    ensure_initial_admin(db_session)
finally:
    db_session.close()

# Endpoint raiz para verificação de saúde (Healthcheck) da API
@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do CompensaHub"}

# Registro das rotas de Autenticação (/api/v1/auth)
app.include_router(auth.router)
# Registro das rotas de Audit Logs (/api/v1/audit-logs)
app.include_router(audit_logs.router)
# Registro das rotas de Departamentos (/api/v1/departments)
app.include_router(departments.router)
# Registro das rotas de Cargos (/api/v1/positions)
app.include_router(job_positions.router)
# Registro das rotas de Faixas Salariais (/api/v1/salary-bands)
app.include_router(salary_bands.router)
# Registro das rotas de Colaboradores (/api/v1/employees)
app.include_router(employees.router)
# Registro das rotas de Configurações (/api/v1/settings)
app.include_router(settings_router.router)
