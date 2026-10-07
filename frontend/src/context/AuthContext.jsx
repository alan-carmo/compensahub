// Importação dos hooks do React para criação de Contexto, Estado e Efeitos colaterais
import React, { createContext, useContext, useState, useEffect } from 'react';

// Criação do Contexto de Autenticação do CompensaHub
const AuthContext = createContext();

// Componente Provedor (Provider) para envolver toda a aplicação com o estado de autenticação
export const AuthProvider = ({ children }) => {
    // Estado do usuário autenticado no sistema (objeto com id, email, full_name, role)
    const [user, setUser] = useState(null);
    // Estado do token JWT armazenado
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    // Estado de carregamento inicial da checagem do token (evita tela branca ou flashes)
    const [loading, setLoading] = useState(true);

    // Efeito executado na inicialização da aplicação para verificar a validade do token
    useEffect(() => {
        // Função assíncrona para validar o token salvo no localStorage
        const verifyToken = async () => {
            // Se existir um token salvo
            if (token) {
                try {
                    // Faz a chamada ao endpoint /api/v1/auth/me enviando o token Bearer
                    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    // Se a resposta for positiva (Status 200 OK)
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        // Se o token estiver expirado ou for inválido, desloga o usuário
                        logout();
                    }
                } catch (error) {
                    console.error('Erro ao verificar sessão do usuário:', error);
                    // Em caso de falha de conexão, recupera o usuário salvo no cache local
                    const cachedUser = localStorage.getItem('user');
                    if (cachedUser) {
                        setUser(JSON.parse(cachedUser));
                    }
                }
            }
            // Finaliza o estado de carregamento inicial
            setLoading(false);
        };

        verifyToken();
    }, [token]);

    // Função de Login enviando e-mail e senha para a API FastAPI
    const login = async (email, password) => {
        try {
            // Envia requisição POST para a rota de login /api/v1/auth/login
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // Se o login for rejeitado pela API (e-mail ou senha inválidos)
            if (!response.ok) {
                return { 
                    success: false, 
                    message: data.detail || 'E-mail ou senha incorretos' 
                };
            }

            // Se o login for bem-sucedido, salva o token e dados do usuário no localStorage
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Atualiza o estado global do React
            setToken(data.access_token);
            setUser(data.user);

            return { success: true };
        } catch (error) {
            console.error('Erro no servidor ao realizar login:', error);
            return { 
                success: false, 
                message: 'Servidor indisponível. Verifique se a API está em execução.' 
            };
        }
    };

    // Função de Logout para encerrar a sessão do usuário
    const logout = () => {
        // Remove as chaves salvas no localStorage do navegador
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Reseta os estados globais do React
        setToken(null);
        setUser(null);
    };

    // Retorna o Provedor do Contexto disponibilizando os dados e métodos para toda a árvore de componentes
    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado `useAuth` para facilitar a utilização do AuthContext nos componentes
export const useAuth = () => {
    // Acessa o contexto do React
    const context = useContext(AuthContext);
    // Lança erro caso o hook seja utilizado fora do AuthProvider
    if (!context) {
        throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
    }
    return context;
};
