// Importação dos hooks do React para controle de estado e efeitos colaterais
import React, { useState, useEffect } from 'react';
// Importação da instância pré-configurada do Axios com interceptor de token JWT
import api from '../api/axios';
// Importação dos ícones estilizados da biblioteca lucide-react
import { History, Search, Filter, RefreshCw, Eye, X, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
// Importação dos estilos exclusivos da página de Auditoria
import styles from './AuditLogs.module.css';

// Dicionário de tradução dos nomes de atributos do banco para rótulos legíveis em português
const FIELD_LABELS = {
    full_name: 'Nome do Colaborador',
    registration_number: 'Matrícula',
    department_name: 'Departamento',
    department_id: 'Departamento (ID)',
    position_title: 'Cargo',
    position_id: 'Cargo (ID)',
    current_salary: 'Salário Salarial (R$)',
    status: 'Status do Funcionário',
    hire_date: 'Data de Admissão',
    company_name: 'Nome da Empresa',
    cnpj: 'CNPJ da Empresa',
    currency: 'Moeda Padrão',
    default_raise_percent: '% Padrão de Reajuste',
    compa_ratio_eligibility_threshold: 'Teto Elegibilidade Compa-Ratio (%)',
    payroll_budget_cap: 'Teto Orçamentário da Folha (R$)'
};

// Componente Principal da Tela de Histórico de Auditoria e Governança
const AuditLogs = () => {
    // Estado com a lista de logs retornados da API
    const [logs, setLogs] = useState([]);
    // Estado de carregamento dos dados
    const [loading, setLoading] = useState(true);
    // Estado de busca textual por palavra-chave
    const [search, setSearch] = useState('');
    // Estado de filtro por tipo de entidade ('ALL', 'EMPLOYEE', 'DEPARTMENT', 'SETTINGS')
    const [selectedEntity, setSelectedEntity] = useState('ALL');
    // Estado de filtro por tipo de ação ('ALL', 'CREATE', 'UPDATE', 'DELETE')
    const [selectedAction, setSelectedAction] = useState('ALL');
    // Estado do log selecionado para exibição na modal de detalhes
    const [selectedLog, setSelectedLog] = useState(null);

    // Função para buscar a lista de auditoria com os filtros aplicados
    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            // Constrói os parâmetros de query string para a API
            const params = {};
            if (selectedEntity !== 'ALL') params.entity_type = selectedEntity;
            if (selectedAction !== 'ALL') params.action = selectedAction;
            if (search.trim()) params.search = search.trim();

            // Chamada GET ao endpoint /audit-logs
            const response = await api.get('/audit-logs', { params });
            const data = response.data || [];

            // Ordena estritamente por ID decrescente (as alterações mais recentes ficam sempre no topo)
            const sortedLogs = [...data].sort((a, b) => b.id - a.id);
            setLogs(sortedLogs);
        } catch (error) {
            console.error('Erro ao carregar histórico de auditoria:', error);
        } finally {
            setLoading(false);
        }
    };

    // Recarrega os logs sempre que os filtros ou busca forem alterados
    useEffect(() => {
        fetchAuditLogs();
    }, [selectedEntity, selectedAction]);

    // Trata a submissão da busca por palavra-chave
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchAuditLogs();
    };

    // Formata datas UTC em formato pt-BR
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Helper para tentar parsear objetos JSON com segurança
    const parseJsonObject = (jsonString) => {
        if (!jsonString) return null;
        if (typeof jsonString === 'object') return jsonString;
        try {
            return JSON.parse(jsonString);
        } catch {
            return null;
        }
    };

    // Helper para formatar valores individuais para exibição amigável
    const formatValue = (key, value) => {
        if (value === null || value === undefined || value === '') return '—';
        
        // Formata valores numéricos de moeda (R$)
        if (key === 'current_salary' || key === 'payroll_budget_cap') {
            const num = parseFloat(value);
            return isNaN(num) ? value : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
        
        // Formata percentuais (%)
        if (key === 'default_raise_percent' || key === 'compa_ratio_eligibility_threshold') {
            return `${value}%`;
        }

        // Formata status de funcionário
        if (key === 'status') {
            if (value === 'ACTIVE') return 'Ativo';
            if (value === 'INACTIVE') return 'Inativo';
        }

        return String(value);
    };

    // Função que renderiza a Tabela de Comparação Formatada dos Campos (Diff Visual)
    const renderDiffTable = (oldJson, newJson) => {
        const oldObj = parseJsonObject(oldJson) || {};
        const newObj = parseJsonObject(newJson) || {};

        // Extrai todas as chaves únicas presentes nos dois objetos
        const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

        // Se não houver atributos gravados
        if (allKeys.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Nenhum detalhe de campo gravado para este registro.
                </div>
            );
        }

        return (
            <div className={styles.diffTableCard}>
                <table className={styles.diffTable}>
                    <thead>
                        <tr>
                            <th>Campo / Atributo</th>
                            <th>Valor Anterior (Before)</th>
                            <th>Novo Valor (After)</th>
                            <th>Status da Alteração</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allKeys.map((key) => {
                            const label = FIELD_LABELS[key] || key;
                            const oldValFormatted = formatValue(key, oldObj[key]);
                            const newValFormatted = formatValue(key, newObj[key]);
                            
                            // Identifica se houve modificação real no campo
                            const isChanged = oldObj[key] !== newObj[key] && oldObj[key] !== undefined && newObj[key] !== undefined;

                            return (
                                <tr key={key} className={isChanged ? styles.rowChanged : ''}>
                                    <td style={{ fontWeight: 600, color: '#8b5cf6' }}>{label}</td>
                                    <td style={{ color: isChanged ? '#ef4444' : 'var(--text-muted)' }}>{oldValFormatted}</td>
                                    <td style={{ color: isChanged ? '#10b981' : 'var(--text-main)', fontWeight: isChanged ? 700 : 400 }}>{newValFormatted}</td>
                                    <td>
                                        {isChanged ? (
                                            <span className={styles.badgeChanged}>MODIFICADO</span>
                                        ) : (
                                            <span className={styles.badgeUnchanged}>Mantido</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Cabeçalho superior da página */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Trilha de Auditoria & Governança</h1>
                    <p className={styles.subtitle}>Histórico imutável de todas as ações, alterações salariais e parâmetros executados no sistema</p>
                </div>
                {/* Botão para recarregar manualmente */}
                <button 
                    className={styles.detailBtn} 
                    onClick={fetchAuditLogs}
                    title="Atualizar Logs"
                >
                    <RefreshCw size={16} />
                    <span>Atualizar</span>
                </button>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className={`${styles.controlsBar} glass-panel`}>
                {/* Formulário de Busca por Texto */}
                <form onSubmit={handleSearchSubmit} className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Buscar por usuário, e-mail ou descrição da alteração..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                {/* Filtros Seletores */}
                <div className={styles.filterGroup}>
                    {/* Filtro por Entidade */}
                    <select
                        className={styles.selectFilter}
                        value={selectedEntity}
                        onChange={(e) => setSelectedEntity(e.target.value)}
                    >
                        <option value="ALL">Todas as Entidades</option>
                        <option value="EMPLOYEE">Colaboradores</option>
                        <option value="SETTINGS">Configurações</option>
                        <option value="DEPARTMENT">Departamentos</option>
                        <option value="JOB_POSITION">Cargos</option>
                    </select>

                    {/* Filtro por Ação */}
                    <select
                        className={styles.selectFilter}
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                    >
                        <option value="ALL">Todas as Ações</option>
                        <option value="CREATE">Criação (CREATE)</option>
                        <option value="UPDATE">Edição (UPDATE)</option>
                        <option value="DELETE">Exclusão (DELETE)</option>
                    </select>
                </div>
            </div>

            {/* Tabela de Logs em Glassmorphism */}
            <div className={`${styles.tableCard} glass-panel`}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Data & Hora</th>
                            <th>Usuário (Quem alterou)</th>
                            <th>Ação</th>
                            <th>Entidade</th>
                            <th>Descrição Detalhada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                    Carregando registros de auditoria...
                                </td>
                            </tr>
                        ) : logs.length > 0 ? (
                            logs.map((log) => {
                                // Define a cor da badge conforme a ação realizada
                                let badgeClass = styles.badgeUpdate;
                                if (log.action === 'CREATE') badgeClass = styles.badgeCreate;
                                if (log.action === 'DELETE') badgeClass = styles.badgeDelete;

                                return (
                                    <tr key={log.id}>
                                        <td className={styles.logDate}>{formatDate(log.created_at)}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className={styles.userNameText}>{log.user_name}</span>
                                                <span className={styles.userEmailText}>{log.user_email || 'admin@compensahub.com'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={badgeClass}>{log.action}</span>
                                        </td>
                                        <td>
                                            <span className={styles.entityBadge}>{log.entity_type}</span>
                                        </td>
                                        <td>{log.description}</td>
                                        <td>
                                            <button
                                                className={styles.detailBtn}
                                                onClick={() => setSelectedLog(log)}
                                                title="Ver Detalhes Formatados"
                                            >
                                                <Eye size={14} />
                                                <span>Ver Detalhes</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    Nenhum log de auditoria encontrado com os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhes Formatados do Registro de Auditoria */}
            {selectedLog && (
                <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        {/* Cabeçalho da Modal */}
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Detalhamento da Alteração #{selectedLog.id}</h3>
                                <p className={styles.modalSubtitle}>
                                    {selectedLog.description}
                                </p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setSelectedLog(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Metadados Executivos do Usuário e Operação */}
                        <div className={styles.userMetaGrid}>
                            <div className={styles.metaBox}>
                                <span className={styles.metaLabel}>Usuário Responsável</span>
                                <span className={styles.metaValue}>{selectedLog.user_name}</span>
                            </div>
                            <div className={styles.metaBox}>
                                <span className={styles.metaLabel}>Login / E-mail</span>
                                <span className={`${styles.metaValue} ${styles.modalUserEmail}`}>
                                    {selectedLog.user_email || 'admin@compensahub.com'}
                                </span>
                            </div>
                            <div className={styles.metaBox}>
                                <span className={styles.metaLabel}>Data & Hora</span>
                                <span className={styles.metaValue}>{formatDate(selectedLog.created_at)}</span>
                            </div>
                            <div className={styles.metaBox}>
                                <span className={styles.metaLabel}>Operação / Entidade</span>
                                <span className={`${styles.metaValue} ${styles.modalActionLabel}`}>
                                    {selectedLog.action} ({selectedLog.entity_type})
                                </span>
                            </div>
                        </div>

                        {/* Tabela Formatada com Comparação de Campos (Diff de Atributos) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 className={styles.modalSectionHeader}>
                                Detalhamento dos Campos Modificados:
                            </h4>
                            {renderDiffTable(selectedLog.old_values, selectedLog.new_values)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Exportação padrão da tela de AuditLogs
export default AuditLogs;
