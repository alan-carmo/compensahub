# Importação da biblioteca de manipulação de hashes e criptografia do Python
import os
import json
import hmac
import base64
import hashlib
import secrets
from typing import Optional
from datetime import datetime
# Importação do FastAPI para gerenciamento de dependências e exceções de autorização
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# Importação de sessão do SQLAlchemy e modelo de Usuário
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

# Chave secreta do sistema para assinatura do token JWT
SECRET_KEY = os.getenv("JWT_SECRET", "COMPENSAHUB_SECRET_KEY_SUPER_SECURE_2026")
# Algoritmo de criptografia do token
ALGORITHM = "HS256"
# Tempo de expiração do token em segundos (24 horas)
ACCESS_TOKEN_EXPIRE_SECONDS = 86400

# Esquema de autenticação Bearer para o Swagger e rotas protegidas
security_bearer = HTTPBearer(auto_error=False)

# Função para gerar hash seguro de senha utilizando PBKDF2 com SHA256 e Salt
def hash_password(password: str) -> str:
    # Geração de um salt aleatório de 16 bytes em hex
    salt = secrets.token_hex(16)
    # Derivação da chave via PBKDF2-HMAC-SHA256 com 100.000 iterações
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    # Retorna o salt e o hash concatenados para armazenamento no banco
    return f"{salt}${pwd_hash}"

# Função para verificar se a senha informada corresponde ao hash armazenado
def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        # Separação do salt e do hash armazenado pelo separador '$'
        salt, original_hash = stored_hash.split('$')
        # Recálculo do hash da senha informada utilizando o mesmo salt
        new_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        # Comparação segura em tempo constante para evitar ataques de timing
        return hmac.compare_digest(new_hash, original_hash)
    except Exception:
        # Em caso de erro na estrutura do hash, retorna Falso
        return False

# Helper para codificação Base64URL sem preenchimento
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

# Helper para decodificação Base64URL
def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

# Função para criar um token de acesso JWT assinado
def create_access_token(data: dict, expires_delta: Optional[int] = ACCESS_TOKEN_EXPIRE_SECONDS) -> str:
    # Definição do cabeçalho JWT
    header = {"alg": "HS256", "typ": "JWT"}
    # Cópia dos dados do payload
    payload = data.copy()
    # Cálculo da data/hora limite de expiração em timestamp Unix
    expiration = int(datetime.utcnow().timestamp()) + expires_delta
    payload["exp"] = expiration

    # Codificação do cabeçalho e do payload em JSON -> Base64URL
    json_header = json.dumps(header, separators=(',', ':')).encode('utf-8')
    json_payload = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    encoded_header = _base64url_encode(json_header)
    encoded_payload = _base64url_encode(json_payload)

    # Formatação da mensagem a ser assinada (header.payload)
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    # Geração da assinatura HMAC-SHA256
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)

    # Retorna o token completo formatado: header.payload.signature
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

# Função para decodificar e validar o token JWT
def decode_access_token(token: str) -> dict:
    try:
        # Divisão do token nas 3 partes: header, payload e signature
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de token inválido"
            )
        
        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')

        # Verificação da assinatura HMAC-SHA256
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(encoded_signature)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Assinatura do token inválida"
            )

        # Decodificação do payload
        payload_bytes = _base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode('utf-8'))

        # Validação da expiração do token
        exp = payload.get("exp")
        if not exp or int(datetime.utcnow().timestamp()) > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado"
            )

        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha ao decodificar token"
        )

# Função de dependência do FastAPI para obter o usuário atual autenticado a partir do Token Bearer
def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    # Se o token não for enviado no cabeçalho
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido"
        )
    
    # Extrai o token do cabeçalho de autorização Bearer
    token = auth.credentials
    # Decodifica e valida o payload do token JWT
    payload = decode_access_token(token)
    # Obtém o ID do usuário contido na propriedade 'sub'
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificação de usuário"
        )

    # Busca o usuário no banco de dados
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )

    # Verifica se a conta está ativa
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )

    return user
