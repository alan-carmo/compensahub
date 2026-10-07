# Importações de colunas e tipos do SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, DateTime
# Importação de classe para controle temporal de alteração
from datetime import datetime
# Importação da classe base declarativa do banco de dados
from app.database import Base

# Modelo de dados da tabela 'system_settings' (Configurações Gerais do Sistema e Parâmetros)
class SystemSettings(Base):
    # Nome da tabela no banco de dados MySQL
    __tablename__ = "system_settings"

    # Chave primária fixa do registro de configurações (ID 1)
    id = Column(Integer, primary_key=True, index=True)
    
    # Parâmetros Cadastrais da Empresa
    company_name = Column(String(150), default="CompensaHub Tecnologia S.A.")
    cnpj = Column(String(30), default="12.345.678/0001-90")
    currency = Column(String(10), default="BRL")

    # Regras Estratégicas de Reajuste Salarial
    default_raise_percent = Column(Float, default=5.0)
    compa_ratio_eligibility_threshold = Column(Float, default=95.0)

    # Teto Orçamentário da Folha Mensal (para controle fiscal e alertas)
    payroll_budget_cap = Column(Float, default=500000.0)

    # Data e hora em que as configurações foram alteradas pela última vez
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
