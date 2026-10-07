# Importação da sessão de banco de dados do SQLAlchemy
from sqlalchemy.orm import Session
# Importação do modelo SQLAlchemy de Configurações
from app.models.settings import SystemSettings
# Importação do schema Pydantic para atualização das configurações
from app.schemas.settings import SettingsUpdate
# Importação do serviço de gravação na trilha de auditoria
from app.services.audit_service import register_log

# Serviço que busca as configurações vigentes (ou cria o registro inicial padrão caso ainda não exista)
def get_settings(db: Session) -> SystemSettings:
    # Consulta o registro de ID 1 na tabela 'system_settings'
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    # Se não for encontrado, cria a linha de configurações com valores iniciais explícitos
    if not settings:
        settings = SystemSettings(
            id=1,
            company_name="CompensaHub Tecnologia S.A.",
            cnpj="12.345.678/0001-90",
            currency="BRL",
            default_raise_percent=5.0,
            compa_ratio_eligibility_threshold=95.0,
            payroll_budget_cap=500000.0
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

# Serviço para salvar e atualizar os parâmetros gerais da empresa e regras salariais
def update_settings(db: Session, settings_in: SettingsUpdate) -> SystemSettings:
    # Garante que temos a instância única de configurações
    settings = get_settings(db)
    
    # Salva o estado dos valores anteriores para registro no log de auditoria
    old_dict = {
        "company_name": settings.company_name,
        "cnpj": settings.cnpj,
        "currency": settings.currency,
        "default_raise_percent": settings.default_raise_percent,
        "compa_ratio_eligibility_threshold": settings.compa_ratio_eligibility_threshold,
        "payroll_budget_cap": settings.payroll_budget_cap
    }

    # Converte os campos enviados excluindo os nulos
    update_data = settings_in.model_dump(exclude_unset=True)
    
    # Atualiza cada atributo fornecido no formulário
    for field, value in update_data.items():
        if value is not None:
            setattr(settings, field, value)
            
    # Efetiva a transação no banco de dados
    db.commit()
    # Recarrega a instância atualizada
    db.refresh(settings)

    # Registra a alteração na trilha de auditoria e governança
    register_log(
        db=db,
        action="UPDATE",
        entity_type="SETTINGS",
        entity_id=1,
        description=f"Atualizou parâmetros da empresa ({settings.company_name}) e teto orçamentário (R$ {settings.payroll_budget_cap:,.2f})",
        old_values=old_dict,
        new_values=update_data
    )

    return settings
