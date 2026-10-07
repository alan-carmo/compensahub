// Importação do React e dos componentes de roteamento do React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Importação do Provedor de Autenticação AuthProvider
import { AuthProvider } from './context/AuthContext';
// Importação do Provedor de Tema ThemeProvider
import { ThemeProvider } from './context/ThemeContext';
// Importação do componente de proteção de rotas privadas
import ProtectedRoute from './components/ProtectedRoute';
// Importação do Layout Principal da aplicação
import MainLayout from './components/Layout/MainLayout';
// Importação das páginas da aplicação
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Positions from './pages/Positions';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Simulator from './pages/Simulator';

// Componente principal da aplicação React
function App() {
  return (
    // Provedor global de tema (Modo Claro / Escuro)
    <ThemeProvider>
      {/* Provedor global de autenticação JWT */}
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota pública de login de acesso */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas acessíveis apenas para usuários autenticados */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Página inicial (Dashboard) */}
              <Route index element={<Dashboard />} />
              {/* Página de Gestão de Departamentos */}
              <Route path="departments" element={<Departments />} />
              {/* Página de Gestão de Cargos */}
              <Route path="positions" element={<Positions />} />
              {/* Página de Quadro de Colaboradores */}
              <Route path="employees" element={<Employees />} />
              {/* Página de Simulador de Reajustes e Mérito */}
              <Route path="simulator" element={<Simulator />} />
              {/* Página de Relatórios Executivos e Exportação */}
              <Route path="reports" element={<Reports />} />
              {/* Página de Trilha de Auditoria e Governança */}
              <Route path="audit-logs" element={<AuditLogs />} />
              {/* Página de Configurações do Sistema */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Rota coringa para redirecionar qualquer caminho desconhecido para o Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Exportação padrão do componente App
export default App;
