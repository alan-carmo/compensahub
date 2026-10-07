# Importação de validação de schemas com Pydantic
from pydantic import BaseModel
# Importação de tipos para campos opcionais e datas
from typing import Optional
from datetime import datetime

# Schema de resposta com informações dos registros de auditoria
class AuditLogResponse(BaseModel):
    # Identificador único do log de auditoria
    id: int
    # ID do usuário que efetuou a alteração
    user_id: Optional[int] = None
    # Nome legível do usuário
    user_name: str
    # E-mail / Login do usuário
    user_email: Optional[str] = "admin@compensahub.com"
    # Ação executada ('CREATE', 'UPDATE', 'DELETE')
    action: str
    # Entidade alterada ('EMPLOYEE', 'DEPARTMENT', 'JOB_POSITION', 'SETTINGS')
    entity_type: str
    # ID da entidade afetada
    entity_id: Optional[int] = None
    # Descrição legível da ação executada
    description: str
    # JSON contendo os valores antes da alteração
    old_values: Optional[str] = None
    # JSON contendo os valores após a alteração
    new_values: Optional[str] = None
    # Timestamp do registro de auditoria
    created_at: datetime

    # Configuração do Pydantic para leitura direta de objetos ORM do SQLAlchemy
    class Config:
        from_attributes = True
