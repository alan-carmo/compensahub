// Importação do React e do componente Outlet para rotas aninhadas do React Router
import React from 'react';
import { Outlet } from 'react-router-dom';
// Importação da barra lateral de navegação
import Sidebar from './Sidebar';
// Importação da Central de Notificações e Alertas no Header
import NotificationBell from '../Notifications/NotificationBell';
// Importação do Botão de Alternância de Tema (Claro / Escuro)
import ThemeToggle from '../Theme/ThemeToggle';
// Importação do hook customizado de autenticação
import { useAuth } from '../../context/AuthContext';
// Importação do ícone de Logout da biblioteca lucide-react
import { LogOut } from 'lucide-react';
// Importação dos estilos em CSS modules do layout principal
import styles from './MainLayout.module.css';

// Componente de Layout Principal da aplicação que agrupa Sidebar, Header e Área de Conteúdo
const MainLayout = () => {
  // Obtém o usuário logado e a função de logout do AuthContext
  const { user, logout } = useAuth();

  // Obtém a inicial do primeiro nome para o avatar do perfil
  const avatarInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <div className={styles.layout}>
      {/* Barra lateral fixa de navegação */}
      <Sidebar />
      
      {/* Conteúdo principal com cabeçalho e páginas injetadas */}
      <main className={styles.mainContent}>
        {/* Cabeçalho superior com efeito glassmorphism */}
        <header className={`${styles.header} glass-panel`}>
          <div className={styles.headerLeft}>
            <h1>CompensaHub</h1>
          </div>

          {/* Área de Alternância de Tema, Notificações, Perfil do Usuário e Botão de Logout */}
          <div className={styles.headerRight}>
            {/* Botão de Alternância de Tema (Modo Claro / Escuro) ao lado do sino */}
            <ThemeToggle />

            {/* Sino de Notificações com Badge e Popover de Anomalias Salariais */}
            <NotificationBell />

            {/* Perfil do usuário logado */}
            <div className={styles.userProfile}>
              {/* Avatar circular com inicial do usuário */}
              <div className={styles.avatar}>{avatarInitial}</div>
              
              {/* Dados do usuário logado (Nome e Perfil/Role) */}
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Administrador'}</span>
                <span className={styles.roleBadge}>{user?.role || 'ADMIN'}</span>
              </div>
            </div>

            {/* Botão para encerrar a sessão no sistema */}
            <button 
              className={styles.logoutBtn}
              onClick={logout}
              title="Sair da Conta"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* O Outlet injeta dinamicamente a página atual (Dashboard, Funcionários, Configurações, etc) */}
        <div className={styles.pageContent}>
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

// Exportação padrão do componente MainLayout
export default MainLayout;
