// Importação do React e dos componentes de roteamento do React Router
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Importação do hook customizado de autenticação
import { useAuth } from '../context/AuthContext';
// Importação de ícone de carregamento do lucide-react
import { Loader2 } from 'lucide-react';

// Componente para proteção de rotas restritas que exigem login
const ProtectedRoute = ({ children }) => {
    // Obtém o usuário autenticado e o estado de carregamento do contexto
    const { user, loading } = useAuth();

    // Se estiver verificando a sessão do usuário no backend, exibe uma tela fluida de carregamento
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
            }}>
                {/* Ícone de spinner animado com rotação contínua */}
                <Loader2 className="animate-spin" size={48} style={{ color: '#8b5cf6', marginBottom: '16px' }} />
                <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>Validando sessão no CompensaHub...</p>
            </div>
        );
    }

    // Se o usuário não estiver autenticado, redireciona para a página de login (/login)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Se o usuário estiver autenticado, renderiza os componentes filhos ou o Outlet das rotas
    return children ? children : <Outlet />;
};

// Exportação padrão do componente de proteção de rotas
export default ProtectedRoute;
