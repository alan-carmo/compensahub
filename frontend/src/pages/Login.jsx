// Importação dos hooks do React e do navegador para redirecionamento
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importação do hook customizado de autenticação
import { useAuth } from '../context/AuthContext';
// Importação dos ícones estilizados da biblioteca lucide-react
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
// Importação dos estilos CSS em módulos no padrão Glassmorphism
import styles from './Login.module.css';

// Componente principal da tela de Login
const Login = () => {
    // Estado local para armazenar o valor do campo de e-mail
    const [email, setEmail] = useState('');
    // Estado local para armazenar o valor do campo de senha
    const [password, setPassword] = useState('');
    // Estado para controlar se a senha deve ser exibida em texto claro ou oculta
    const [showPassword, setShowPassword] = useState(false);
    // Estado de erro de autenticação para exibição de alerta ao usuário
    const [error, setError] = useState('');
    // Estado indicando se a requisição de login está em processamento
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Obtém a função de login disponibilizada pelo AuthContext
    const { login } = useAuth();
    // Hook do React Router para navegação de páginas
    const navigate = useNavigate();

    // Manipulador de submissão do formulário de login
    const handleSubmit = async (e) => {
        // Previne o comportamento padrão do navegador de recarregar a página
        e.preventDefault();
        // Limpa mensagens de erro anteriores
        setError('');

        // Validação básica dos campos
        if (!email.trim() || !password.trim()) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        // Ativa o estado de envio/carregamento
        setIsSubmitting(true);

        try {
            // Executa o login assíncrono via AuthContext
            const result = await login(email, password);
            
            // Se o login for bem-sucedido
            if (result.success) {
                // Redireciona o usuário para o Dashboard principal
                navigate('/');
            } else {
                // Exibe a mensagem de erro retornada pela API
                setError(result.message);
            }
        } catch (err) {
            // Trata falhas inesperadas
            setError('Ocorreu um erro ao tentar realizar o login.');
        } finally {
            // Desativa o estado de carregamento do botão
            setIsSubmitting(false);
        }
    };

    // Função de conveniência para preenchimento rápido de credenciais de teste
    const fillDemoCredentials = () => {
        setEmail('admin@compensahub.com');
        setPassword('admin123');
        setError('');
    };

    return (
        <div className={styles.loginContainer}>
            {/* Esferas de iluminação ambiente no fundo */}
            <div className={styles.glowTopLeft}></div>
            <div className={styles.glowBottomRight}></div>

            {/* Card central estilizado com efeito de vidro fosco */}
            <div className={styles.glassCard}>
                {/* Cabeçalho com o emblema e nome do sistema */}
                <div className={styles.header}>
                    <div className={styles.logoBadge}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className={styles.title}>CompensaHub</h1>
                    <p className={styles.subtitle}>Gestão Estratégica de Cargos & Salários</p>
                </div>

                {/* Mensagem de alerta em caso de falha de autenticação */}
                {error && (
                    <div className={styles.errorMessage}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Formulário de autenticação */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Campo de entrada do E-mail */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>E-mail Corporativo</label>
                        <div className={styles.inputWrapper}>
                            <Mail className={styles.inputIcon} size={18} />
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="exemplo@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo de entrada da Senha com alternância de visibilidade */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Senha de Acesso</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {/* Botão para mostrar/ocultar senha */}
                            <button
                                type="button"
                                className={styles.togglePasswordBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Botão de confirmação de entrada no sistema */}
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Autenticando...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Entrar no Sistema</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Bloco de ajuda para teste rápido do avaliador/usuário */}
                <div className={styles.demoBox}>
                    <p className={styles.demoTitle}>Ambiente de Demonstração</p>
                    <button
                        type="button"
                        className={styles.demoButton}
                        onClick={fillDemoCredentials}
                    >
                        ⚡ Preencher Credenciais de Teste (Admin)
                    </button>
                </div>
            </div>
        </div>
    );
};

// Exportação padrão do componente da tela de Login
export default Login;
