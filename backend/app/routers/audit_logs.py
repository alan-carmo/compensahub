# Importação das ferramentas de roteamento e dependências do FastAPI
from fastapi import APIRouter, Depends, Query
# Importação de suporte a lista e digitação opcional
from typing import List, Optional
# Importação de sessão do banco de dados SQLAlchemy
from sqlalchemy.orm import Session
from app.database import get_db

# Importação dos schemas de auditoria e do serviço de consulta
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import get_audit_logs

# Instanciação do APIRouter com prefixo /api/v1/audit-logs
router = APIRouter(prefix="/api/v1/audit-logs", tags=["Auditoria & Governança"])

# Endpoint para listar a trilha de auditoria do sistema com filtros
@router.get("/", response_model=List[AuditLogResponse])
def read_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filtro por entidade (EMPLOYEE, DEPARTMENT, JOB_POSITION, SETTINGS)"),
    action: Optional[str] = Query(None, description="Filtro por ação (CREATE, UPDATE, DELETE)"),
    search: Optional[str] = Query(None, description="Busca por texto na descrição ou nome do usuário"),
    limit: int = Query(100, ge=1, le=500, description="Limite de registros por página"),
    offset: int = Query(0, ge=0, description="Deslocamento para paginação"),
    db: Session = Depends(get_db)
):
    # Executa a consulta no serviço de auditoria com os filtros recebidos
    return get_audit_logs(
        db=db,
        entity_type=entity_type,
        action=action,
        search=search,
        limit=limit,
        offset=offset
    )
