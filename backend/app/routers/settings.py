# Importação dos módulos do FastAPI e Injeção de Dependências
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Importação da sessão de banco de dados
from app.database import get_db
# Importação dos schemas de validação e serialização de configurações
from app.schemas.settings import SettingsResponse, SettingsUpdate
# Importação do serviço com a regra de negócio de configurações
from app.services import settings_service

# Instância do roteador com prefixo '/api/v1/settings'
router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse)
@router.get("", response_model=SettingsResponse)
def read_settings(db: Session = Depends(get_db)):
    """Retorna os parâmetros vigentes da empresa, teto de folha e regras de reajuste."""
    return settings_service.get_settings(db=db)

@router.put("/", response_model=SettingsResponse)
@router.put("", response_model=SettingsResponse)
def update_settings(settings_in: SettingsUpdate, db: Session = Depends(get_db)):
    """Atualiza os parâmetros do sistema e recalcula restrições estratégicas."""
    return settings_service.update_settings(db=db, settings_in=settings_in)
