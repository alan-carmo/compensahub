# Importação das estruturas numéricas, de data e relacionamentos do SQLAlchemy
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Numeric, Date
# Importação para declaração de relacionamentos ORM
from sqlalchemy.orm import relationship
# Importação da biblioteca de data e hora do Python
from datetime import datetime
# Importação da classe Base configurada no banco de dados
from app.database import Base

# Modelo de dados da tabela 'salary_bands' (Faixas Salariais e Versionamento de Mercado)
class SalaryBand(Base):
    # Nome da tabela no MySQL
    __tablename__ = "salary_bands"

    # Chave primária autoincrementável da faixa salarial
    id = Column(Integer, primary_key=True, index=True)
    # Chave estrangeira ligando esta faixa ao seu cargo correspondente em 'job_positions'
    position_id = Column(Integer, ForeignKey("job_positions.id"), nullable=False)
    
    # Salário Mínimo aceitável para o cargo (tipicamente 80% do valor de mercado)
    min_salary = Column(Numeric(10, 2), nullable=False)
    # Salário Médio / Alvo de mercado (midpoint de 100% da pesquisa salarial)
    mid_salary = Column(Numeric(10, 2), nullable=False)
    # Salário Máximo aceitável para o cargo (tipicamente 120% do valor de mercado)
    max_salary = Column(Numeric(10, 2), nullable=False)
    
    # Data de início da vigência desta faixa salarial no mercado
    effective_from = Column(Date, nullable=False)
    # Data de término da vigência (preenchida automaticamente quando a faixa é substituída)
    effective_until = Column(Date, nullable=True)
    # Indicador de versão vigente: True indica a faixa atual, False indica uma versão histórica arquivada
    is_current = Column(Boolean, default=True)
    
    # Data e hora do registro inicial da faixa no banco
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento que conecta esta faixa de volta ao cargo pertencente
    job_position = relationship("JobPosition", back_populates="salary_bands")
