// Importação do React
import React from 'react';
// Importação dos ícones de Sol e Lua da biblioteca lucide-react
import { Sun, Moon } from 'lucide-react';
// Importação do hook customizado do contexto de tema
import { useTheme } from '../../context/ThemeContext';
// Importação dos estilos em CSS Modules do botão
import styles from './ThemeToggle.module.css';

// Componente do Botão de Alternância de Tema (Modo Escuro / Modo Claro)
const ThemeToggle = () => {
    // Obtém o tema atual ('dark' ou 'light') e a função de alternância do contexto
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className={styles.themeButton}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
            {/* Se o tema for escuro, exibe o ícone de Sol para mudar para Claro. Se for claro, exibe a Lua */}
            {theme === 'dark' ? (
                <Sun size={20} style={{ color: '#f59e0b' }} />
            ) : (
                <Moon size={20} style={{ color: '#6366f1' }} />
            )}
        </button>
    );
};

// Exportação padrão do componente ThemeToggle
export default ThemeToggle;
