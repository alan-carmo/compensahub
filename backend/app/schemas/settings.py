# Importação do Pydantic para validação e serialização de dados
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# Schema para atualização dos parâmetros do sistema
class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    cnpj: Optional[str] = None
    currency: Optional[str] = None
    default_raise_percent: Optional[float] = None
    compa_ratio_eligibility_threshold: Optional[float] = None
    payroll_budget_cap: Optional[float] = None

# Schema para resposta serializada das configurações retornadas da API
class SettingsResponse(BaseModel):
    id: int
    company_name: Optional[str] = "CompensaHub Tecnologia S.A."
    cnpj: Optional[str] = "12.345.678/0001-90"
    currency: Optional[str] = "BRL"
    default_raise_percent: Optional[float] = 5.0
    compa_ratio_eligibility_threshold: Optional[float] = 95.0
    payroll_budget_cap: Optional[float] = 500000.0
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
