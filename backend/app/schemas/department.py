# Importação das classes base de validação e configuração do Pydantic
from pydantic import BaseModel, ConfigDict
# Importação da classe de data e hora para serialização de retornos
from datetime import datetime
# Importação do tipo genérico Optional para campos opcionais
from typing import Optional

# Schema de Validação para Criação de Departamento (Enviado no corpo da requisição POST)
class DepartmentCreate(BaseModel):
    # Nome obrigatório do departamento (ex: "Tecnologia")
    name: str
    # Código opcional do centro de custo (ex: "CC-1002")
    cost_center: Optional[str] = None
    # Status inicial do departamento (Padrão: True = Ativo)
    is_active: bool = True

# Schema de Validação para Atualização de Departamento (Enviado no corpo da requisição PUT)
class DepartmentUpdate(BaseModel):
    # Nome opcional para alteração
    name: Optional[str] = None
    # Centro de custo opcional para alteração
    cost_center: Optional[str] = None
    # Status opcional para alteração (Ativo/Inativo)
    is_active: Optional[bool] = None

# Schema de Resposta da API (Estrutura serializada em JSON devolvida para o Front-end)
class DepartmentResponse(BaseModel):
    # Identificador único do departamento gerado pelo banco
    id: int
    # Nome do departamento
    name: str
    # Centro de custo
    cost_center: Optional[str] = None
    # Status do departamento
    is_active: bool
    # Timestamp da data de criação no formato ISO 8601
    created_at: datetime

    # Configuração do Pydantic v2 para permitir a conversão automática de objetos SQLAlchemy em JSON
    model_config = ConfigDict(from_attributes=True)
