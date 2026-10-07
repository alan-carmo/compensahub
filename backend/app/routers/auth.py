# Importação do APIRouter e utilitários de exceção do FastAPI
from fastapi import APIRouter, Depends, HTTPException, status
# Importação da sessão do banco de dados
from sqlalchemy.orm import Session
from app.database import get_db

# Importação do modelo de Usuário e schemas do Pydantic
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserResponse, UserCreate

# Importação dos serviços de autenticação, criptografia e dependência de usuário atual
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

# Instanciação do APIRouter para o módulo de autenticação com prefixo /api/v1/auth
router = APIRouter(prefix="/api/v1/auth", tags=["Autenticação"])

# Função auxiliar para garantir que exista pelo menos um usuário administrador inicial no banco
def ensure_initial_admin(db: Session):
    # Verifica se já existe algum usuário cadastrado
    existing_user = db.query(User).first()
    # Se não houver nenhum usuário, cria o admin padrão
    if not existing_user:
        admin_user = User(
            email="admin@compensahub.com",
            full_name="Administrador CompensaHub",
            hashed_password=hash_password("admin123"),
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()

# Endpoint para realização de login do usuário e emissão de token JWT
@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Garante que o usuário admin exista se for o primeiro acesso
    ensure_initial_admin(db)
    
    # Busca o usuário pelo e-mail informado
    user = db.query(User).filter(User.email == login_data.email).first()
    
    # Valida se o usuário existe e se a senha está correta
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )
    
    # Valida se a conta do usuário está ativa
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conta de usuário inativa"
        )
    
    # Cria os dados do payload do token JWT
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    
    # Gera o token de acesso assinado
    access_token = create_access_token(data=token_payload)
    
    # Retorna o token JWT e as informações do usuário autenticado
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Endpoint para obter os dados do usuário autenticado atual (/api/v1/auth/me)
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    # Retorna diretamente os dados do usuário obtido pela dependência
    return current_user
