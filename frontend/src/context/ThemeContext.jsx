// Importação dos hooks do React para gerenciar estado e contexto global do tema
import React, { createContext, useContext, useState, useEffect } from 'react';

// Criação do contexto de tema da aplicação
const ThemeContext = createContext();

// Provedor de Tema para controlar a alternância entre os modos Claro e Escuro
export const ThemeProvider = ({ children }) => {
    // Inicializa o tema com a preferência salva no localStorage ou o padrão 'dark'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // Efeito para aplicar o atributo data-theme no html e salvar a preferência no localStorage
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Função para alternar entre os modos 'dark' e 'light'
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook customizado useTheme para facilitar a utilização do tema nos componentes
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
    }
    return context;
};
