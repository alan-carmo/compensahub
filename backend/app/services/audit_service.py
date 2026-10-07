# Importação da biblioteca para serialização de dicionários em texto JSON
import json
# Importação de suporte a datas
from datetime import datetime
from typing import Optional, List, Dict, Any
# Importação da sessão de banco de dados do SQLAlchemy
from sqlalchemy.orm import Session
# Importação do modelo AuditLog
from app.models.audit_log import AuditLog

# Helper para converter objetos/dicionários em JSON string legível com segurança
def _serialize_json(data: Any) -> Optional[str]:
    # Se os dados forem nulos, retorna None
    if data is None:
        return None
    try:
        # Se for string, já retorna diretamente
        if isinstance(data, str):
            return data
        # Se for dicionário ou lista, converte para string JSON formatada
        return json.dumps(data, default=str, ensure_ascii=False)
    except Exception:
        return str(data)

# Função para registrar uma nova entrada na trilha de auditoria do sistema
def register_log(
    db: Session,
    action: str,
    entity_type: str,
    description: str,
    user_id: Optional[int] = 1,
    user_name: str = "Administrador CompensaHub",
    user_email: str = "admin@compensahub.com",
    entity_id: Optional[int] = None,
    old_values: Any = None,
    new_values: Any = None
) -> AuditLog:
    # Cria uma nova instância de AuditLog utilizando a hora local da máquina (datetime.now)
    log_entry = AuditLog(
        user_id=user_id,
        user_name=user_name,
        user_email=user_email,
        action=action.upper(),
        entity_type=entity_type.upper(),
        entity_id=entity_id,
        description=description,
        old_values=_serialize_json(old_values),
        new_values=_serialize_json(new_values),
        created_at=datetime.now()
    )
    # Adiciona o registro à sessão do banco de dados
    db.add(log_entry)
    # Efetiva a gravação no banco
    db.commit()
    # Atualiza o objeto log_entry com a chave primária gerada
    db.refresh(log_entry)
    return log_entry

# Função para consultar o histórico de auditoria ordenando estritamente pelas alterações mais recentes no topo
def get_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    # Inicia a consulta base na tabela de audit_logs
    query = db.query(AuditLog)

    # Filtra por tipo de entidade caso informado
    if entity_type and entity_type.upper() != "ALL":
        query = query.filter(AuditLog.entity_type == entity_type.upper())

    # Filtra por ação realizada caso informada
    if action and action.upper() != "ALL":
        query = query.filter(AuditLog.action == action.upper())

    # Filtra por palavra-chave na descrição, nome do usuário ou e-mail
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (AuditLog.description.like(search_filter)) | 
            (AuditLog.user_name.like(search_filter)) |
            (AuditLog.user_email.like(search_filter))
        )

    # Ordena estritamente pelos IDs mais recentes decrescentes (ID desc) para garantir as alterações mais recentes no topo
    return query.order_by(AuditLog.id.desc(), AuditLog.created_at.desc()).offset(offset).limit(limit).all()
