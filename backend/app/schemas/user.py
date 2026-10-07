# Importação das classes de validação e digitação do Pydantic
from pydantic import BaseModel
# Importação de suporte a tipos opcionais e datas
from typing import Optional
from datetime import datetime

# Schema base para informações comuns de Usuário
class UserBase(BaseModel):
    # E-mail válido do usuário (utiliza str para evitar dependência externa do email-validator)
    email: str
    # Nome completo do usuário
    full_name: str
    # Perfil de acesso do usuário (padrão 'ADMIN')
    role: Optional[str] = "ADMIN"

# Schema para criação de um novo usuário (recebido na rota de registro/cadastro)
class UserCreate(UserBase):
    # Senha em texto puro enviada pelo cliente no momento do cadastro
    password: str

# Schema de resposta com dados públicos do usuário (sem expor a senha)
class UserResponse(UserBase):
    # Identificador único do usuário no banco de dados
    id: int
    # Estado de ativação da conta
    is_active: bool
    # Data de criação do registro
    created_at: datetime

    # Configuração do Pydantic para aceitar objetos ORM do SQLAlchemy
    class Config:
        from_attributes = True

# Schema para dados de login enviando e-mail e senha
class UserLogin(BaseModel):
    # E-mail cadastrado
    email: str
    # Senha secreta
    password: str

# Schema de resposta do Token JWT gerado após o login bem-sucedido
class Token(BaseModel):
    # Token JWT codificado
    access_token: str
    # Tipo do token enviado (padrão 'bearer')
    token_type: str = "bearer"
    # Informações completas do usuário autenticado
    user: UserResponse
