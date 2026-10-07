// Importação do React e do NavLink do React Router para links de navegação com destaque ativo
import React from 'react';
import { NavLink } from 'react-router-dom';
// Importação dos ícones do Lucide React para o menu lateral
import { LayoutDashboard, Users, Briefcase, BarChart3, Settings, History, FileSpreadsheet, Sliders } from 'lucide-react';
// Importação dos estilos em CSS Modules da Sidebar
import styles from './Sidebar.module.css';

// Componente da Barra Lateral Fixa de Navegação
const Sidebar = () => {
  return (
    <aside className={`${styles.sidebar} glass-panel`}>
      {/* Logotipo do sistema no topo da barra */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>C</div>
        <h2>CompensaHub</h2>
      </div>
      
      {/* Menu principal de navegação de telas */}
      <nav className={styles.nav}>
        {/* Link para o Dashboard */}
        <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* Link para Gestão de Departamentos */}
        <NavLink to="/departments" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Briefcase size={20} />
          <span>Departamentos</span>
        </NavLink>

        {/* Link para Gestão de Cargos e Faixas Salariais */}
        <NavLink to="/positions" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <BarChart3 size={20} />
          <span>Cargos e Faixas</span>
        </NavLink>

        {/* Link para Quadro de Colaboradores */}
        <NavLink to="/employees" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Users size={20} />
          <span>Funcionários</span>
        </NavLink>

        {/* Link para Simulador de Reajustes Salariais */}
        <NavLink to="/simulator" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Sliders size={20} />
          <span>Simulador & Mérito</span>
        </NavLink>

        {/* Link para Relatórios Executivos e Exportação */}
        <NavLink to="/reports" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <FileSpreadsheet size={20} />
          <span>Relatórios & PDF</span>
        </NavLink>

        {/* Link para Trilha de Auditoria & Governança */}
        <NavLink to="/audit-logs" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <History size={20} />
          <span>Auditoria & Logs</span>
        </NavLink>
      </nav>

      {/* Rodapé da Sidebar com atalho para Configurações */}
      <div className={styles.footer}>
        <NavLink to="/settings" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Settings size={20} />
          <span>Configurações</span>
        </NavLink>
      </div>
    </aside>
  );
};

// Exportação padrão da Sidebar
export default Sidebar;
