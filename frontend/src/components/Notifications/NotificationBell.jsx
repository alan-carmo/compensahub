// Importação de hooks do React para controle de estado, efeitos e referências da DOM
import React, { useState, useEffect, useRef } from 'react';
// Importação do hook de navegação do React Router para redirecionamento inteligente
import { useNavigate } from 'react-router-dom';
// Importação dos ícones estilizados da biblioteca lucide-react
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, DollarSign, Users, X } from 'lucide-react';
// Importação da instância pré-configurada do Axios
import api from '../../api/axios';
// Importação dos estilos em CSS Modules
import styles from './NotificationBell.module.css';

// Componente da Central de Notificações e Alertas no Header
const NotificationBell = () => {
  // Estado para controlar a abertura/fechamento do menu popover
  const [isOpen, setIsOpen] = useState(false);
  // Estado com a lista de notificações geradas dinamicamente
  const [notifications, setNotifications] = useState([]);
  // Estado da aba de filtro selecionada ('ALL', 'CRITICAL', 'WARNING')
  const [activeTab, setActiveTab] = useState('ALL');
  // Referência da DOM para detectar cliques fora do componente e fechar o popover
  const popoverRef = useRef(null);
  // Hook de navegação de rotas do React Router
  const navigate = useNavigate();

  // Efeito executado ao carregar o componente para buscar dados reais e calcular alertas
  useEffect(() => {
    // Função assíncrona para buscar colaboradores e configurações e analisar anomalias
    const calculateNotifications = async () => {
      try {
        // Executa em paralelo as chamadas à API de colaboradores e configurações
        const [empRes, setRes] = await Promise.all([
          api.get('/employees'),
          api.get('/settings')
        ]);

        const employees = empRes.data || [];
        const settings = setRes.data || {};

        // Lista temporária para armazenar todas as notificações geradas
        const generatedAlerts = [];

        // 1. ANÁLISE DE TETO ORÇAMENTÁRIO DA FOLHA
        const totalPayroll = employees.reduce((sum, emp) => sum + (parseFloat(emp.current_salary) || 0), 0);
        const budgetCap = settings.payroll_budget_cap || 500000;

        // Se a folha total ultrapassou o teto cadastrado
        if (totalPayroll > budgetCap) {
          const overflow = totalPayroll - budgetCap;
          generatedAlerts.push({
            id: 'budget-exceeded',
            type: 'CRITICAL',
            icon: DollarSign,
            title: 'Teto Orçamentário Excedido!',
            message: `A folha salarial mensal (R$ ${totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) ultrapassou o teto estipulado de R$ ${budgetCap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em R$ ${overflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
            link: '/settings',
            actionText: 'Ver Configurações',
            timestamp: 'Agora',
            read: false
          });
        } 
        // Se a folha atingiu mais de 90% do teto
        else if (totalPayroll >= budgetCap * 0.9) {
          const percentUsed = ((totalPayroll / budgetCap) * 100).toFixed(1);
          generatedAlerts.push({
            id: 'budget-warning',
            type: 'WARNING',
            icon: AlertTriangle,
            title: 'Aviso de Orçamento Próximo do Limite',
            message: `A folha mensal atingiu ${percentUsed}% do teto cadastrado. Restam R$ ${(budgetCap - totalPayroll).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponíveis.`,
            link: '/settings',
            actionText: 'Ver Orçamento',
            timestamp: 'Agora',
            read: false
          });
        }

        // 2. ANÁLISE DE COMPA-RATIO CRÍTICO (< 80%)
        const criticalEmployees = employees.filter(emp => (emp.compa_ratio && emp.compa_ratio < 80) || emp.compa_ratio_status?.includes('CRÍTICO'));
        if (criticalEmployees.length > 0) {
          generatedAlerts.push({
            id: 'compa-ratio-critical',
            type: 'CRITICAL',
            icon: AlertCircle,
            title: 'Anomalia Salarial: Compa-Ratio Crítico',
            message: `${criticalEmployees.length} colaborador(es) estão com o salário abaixo de 80% da mediana do mercado (risco de retenção).`,
            link: '/employees',
            actionText: 'Ver Colaboradores',
            timestamp: 'Agora',
            read: false
          });
        }

        // 3. ANÁLISE DE COMPA-RATIO ACIMA DA FAIXA (> 120%)
        const highEmployees = employees.filter(emp => emp.compa_ratio && emp.compa_ratio > 120);
        if (highEmployees.length > 0) {
          generatedAlerts.push({
            id: 'compa-ratio-high',
            type: 'WARNING',
            icon: AlertTriangle,
            title: 'Salários Acima da Faixa (> 120%)',
            message: `${highEmployees.length} colaborador(es) possuem salário atual acima do teto estipulado para a faixa salarial do cargo.`,
            link: '/employees',
            actionText: 'Ver no Quadro',
            timestamp: 'Agora',
            read: false
          });
        }

        // 4. ANÁLISE DE ELEGIBILIDADE PARA REAJUSTE DE MÉRITO
        const threshold = settings.compa_ratio_eligibility_threshold || 95.0;
        const eligibleEmployees = employees.filter(emp => emp.compa_ratio && emp.compa_ratio <= threshold);
        if (eligibleEmployees.length > 0) {
          generatedAlerts.push({
            id: 'raise-eligible',
            type: 'INFO',
            icon: Info,
            title: 'Elegíveis para Reajuste de Mérito',
            message: `${eligibleEmployees.length} colaborador(es) possuem Compa-Ratio <= ${threshold}% e estão elegíveis para aplicação de reajuste.`,
            link: '/employees',
            actionText: 'Analisar Elegíveis',
            timestamp: 'Hoje',
            read: false
          });
        }

        // Atualiza o estado com as notificações geradas
        setNotifications(generatedAlerts);
      } catch (err) {
        console.error('Erro ao calcular alertas de notificação:', err);
      }
    };

    calculateNotifications();
  }, []);

  // Efeito para fechar o popover ao clicar em qualquer área fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calcula a quantidade de notificações não lidas para o badge
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filtra as notificações conforme a aba ativa ('ALL', 'CRITICAL', 'WARNING')
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'CRITICAL') return n.type === 'CRITICAL';
    if (activeTab === 'WARNING') return n.type === 'WARNING' || n.type === 'INFO';
    return true;
  });

  // Marca todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Trata o clique no link da ação da notificação e fecha o popover
  const handleActionClick = (link) => {
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className={styles.notificationBellContainer} ref={popoverRef}>
      {/* Botão de acionamento do sino */}
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Central de Alertas e Notificações"
      >
        <Bell size={20} />
        {/* Exibe o badge animado vermelho se houver notificações não lidas */}
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {/* Popover suspenso de notificações em Glassmorphism */}
      {isOpen && (
        <div className={styles.popover}>
          {/* Cabeçalho do Popover */}
          <div className={styles.popoverHeader}>
            <div className={styles.headerTitleGroup}>
              <h3 className={styles.popoverTitle}>Alertas & Notificações</h3>
              {unreadCount > 0 && (
                <span className={styles.headerBadge}>{unreadCount} pendentes</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className={styles.markReadBtn} onClick={markAllAsRead}>
                Marcar lidas
              </button>
            )}
          </div>

          {/* Barra de Abas de Filtragem */}
          <div className={styles.tabBar}>
            <button 
              className={`${styles.tabItem} ${activeTab === 'ALL' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Todas ({notifications.length})
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === 'CRITICAL' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('CRITICAL')}
            >
              Críticas ({notifications.filter(n => n.type === 'CRITICAL').length})
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === 'WARNING' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('WARNING')}
            >
              Alertas ({notifications.filter(n => n.type === 'WARNING' || n.type === 'INFO').length})
            </button>
          </div>

          {/* Lista de Cards de Notificação */}
          <div className={styles.notificationList}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => {
                const IconComponent = item.icon;
                // Define a classe CSS baseada no tipo da notificação
                let cardClass = styles.cardInfo;
                let iconColor = '#3b82f6';
                if (item.type === 'CRITICAL') {
                  cardClass = styles.cardCritical;
                  iconColor = '#ef4444';
                } else if (item.type === 'WARNING') {
                  cardClass = styles.cardWarning;
                  iconColor = '#f59e0b';
                }

                return (
                  <div key={item.id} className={`${styles.card} ${cardClass}`}>
                    {/* Ícone indicador do tipo */}
                    <div className={styles.cardIconWrapper}>
                      <IconComponent size={20} style={{ color: iconColor }} />
                    </div>

                    {/* Conteúdo textual */}
                    <div className={styles.cardBody}>
                      <h4 className={styles.cardTitle}>{item.title}</h4>
                      <p className={styles.cardDesc}>{item.message}</p>
                      
                      {/* Rodapé com timestamp e link de ação */}
                      <div className={styles.cardFooter}>
                        <span className={styles.timestamp}>{item.timestamp}</span>
                        {item.link && (
                          <span 
                            className={styles.actionLink}
                            onClick={() => handleActionClick(item.link)}
                          >
                            {item.actionText} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Estado vazio quando não houver anomalias ou notificações
              <div className={styles.emptyState}>
                <CheckCircle2 size={36} className={styles.emptyIcon} style={{ color: '#10b981' }} />
                <p className={styles.emptyText}>Nenhuma anomalia salarial ou orçamentária detectada!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Exportação padrão do componente NotificationBell
export default NotificationBell;
