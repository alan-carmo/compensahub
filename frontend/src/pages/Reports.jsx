// Importação de hooks do React para estado e efeitos
import React, { useState, useEffect } from 'react';
// Importação da instância pré-configurada do Axios
import api from '../api/axios';
// Importação de ícones da biblioteca lucide-react
import { FileSpreadsheet, Printer, Download, TrendingUp, Users, DollarSign, PieChart, CheckCircle2 } from 'lucide-react';
// Importação dos estilos exclusivos da tela de Relatórios Executivos
import styles from './Reports.module.css';

// Componente Principal da Tela de Relatórios Executivos e Exportação
const Reports = () => {
    // Estado para guardar os colaboradores vindos da API
    const [employees, setEmployees] = useState([]);
    // Estado para guardar os departamentos vindos da API
    const [departments, setDepartments] = useState([]);
    // Estado com as configurações da empresa
    const [settings, setSettings] = useState({});
    // Estado de carregamento
    const [loading, setLoading] = useState(true);

    // Efeito para buscar dados reais do backend ao carregar a tela
    useEffect(() => {
        Promise.all([
            api.get('/employees'),
            api.get('/departments/'),
            api.get('/settings')
        ])
        .then(([empRes, deptRes, setRes]) => {
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
            setSettings(setRes.data || {});
        })
        .catch(err => console.error('Erro ao carregar dados dos relatórios:', err))
        .finally(() => setLoading(false));
    }, []);

    // Cálculo da folha total
    const totalPayroll = employees.reduce((sum, emp) => sum + (parseFloat(emp.current_salary) || 0), 0);
    // Cálculo da média salarial
    const avgSalary = employees.length > 0 ? totalPayroll / employees.length : 0;

    // Cálculo do Compa-Ratio médio geral
    const validCRs = employees.filter(e => e.compa_ratio && e.compa_ratio > 0);
    const avgCompaRatio = validCRs.length > 0 
        ? (validCRs.reduce((sum, e) => sum + e.compa_ratio, 0) / validCRs.length).toFixed(1)
        : '0.0';

    // Função para acionar a exportação em formato CSV / Excel
    const handleExportCSV = () => {
        // Cabeçalhos das colunas da planilha CSV
        const headers = ['Matrícula', 'Colaborador', 'Departamento', 'Cargo', 'Salário Atual (R$)', 'Compa-Ratio (%)', 'Status Compa-Ratio', 'Data de Admissão'];
        
        // Linhas de dados dos colaboradores
        const rows = employees.map(emp => [
            `"${emp.registration_number || ''}"`,
            `"${emp.full_name || ''}"`,
            `"${emp.department_name || ''}"`,
            `"${emp.position_title || ''}"`,
            `"${(parseFloat(emp.current_salary) || 0).toFixed(2)}"`,
            `"${emp.compa_ratio || ''}"`,
            `"${emp.compa_ratio_status || ''}"`,
            `"${emp.hire_date || ''}"`
        ]);

        // Montagem do conteúdo do arquivo CSV com quebras de linha
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
        // Criação de link invisível para download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `relatorio_compensahub_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Função para acionar a impressão / salvamento nativo em PDF do navegador
    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            {/* Cabeçalho da página com título e botões de exportação */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Relatórios Executivos & Analytics</h1>
                    <p className={styles.subtitle}>Visão analítica consolidada de remuneração, folha mensal e distribuição salarial</p>
                </div>
                {/* Botões de Ação de Exportação */}
                <div className={styles.exportActions}>
                    <button className={styles.exportCsvBtn} onClick={handleExportCSV}>
                        <FileSpreadsheet size={16} />
                        <span>Exportar Excel (CSV)</span>
                    </button>
                    <button className={styles.exportPdfBtn} onClick={handlePrintPDF}>
                        <Printer size={16} />
                        <span>Imprimir / Salvar PDF</span>
                    </button>
                </div>
            </div>

            {/* Grid de Resumo Executivo em Cards Glassmorphism */}
            <div className={styles.summaryGrid}>
                {/* Card 1: Total de Colaboradores */}
                <div className={`${styles.summaryCard} glass-panel`}>
                    <span className={styles.summaryLabel}>Total de Colaboradores</span>
                    <span className={styles.summaryValue}>{employees.length}</span>
                    <span className={styles.summarySub}>Ativos no sistema</span>
                </div>

                {/* Card 2: Folha Mensal Total */}
                <div className={`${styles.summaryCard} glass-panel`}>
                    <span className={styles.summaryLabel}>Folha Salarial Mensal</span>
                    <span className={styles.summaryValue}>R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className={styles.summarySub}>Teto: R$ {(settings.payroll_budget_cap || 500000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Card 3: Média Salarial Geral */}
                <div className={`${styles.summaryCard} glass-panel`}>
                    <span className={styles.summaryLabel}>Média Salarial Geral</span>
                    <span className={styles.summaryValue}>R$ {avgSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className={styles.summarySub}>Por colaborador</span>
                </div>

                {/* Card 4: Compa-Ratio Médio da Empresa */}
                <div className={`${styles.summaryCard} glass-panel`}>
                    <span className={styles.summaryLabel}>Compa-Ratio Médio</span>
                    <span className={styles.summaryValue}>{avgCompaRatio}%</span>
                    <span className={styles.summarySub}>Alinhamento de mercado</span>
                </div>
            </div>

            {/* Tabela de Resumo Salarial por Departamento */}
            <div className={`${styles.tableCard} glass-panel`}>
                <h3 className={styles.cardTitle}>Análise da Folha por Departamento</h3>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Departamento</th>
                            <th>Colaboradores</th>
                            <th>Custo Folha Total (R$)</th>
                            <th>Média Salarial (R$)</th>
                            <th>Participação no Orçamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map(dept => {
                            const deptEmployees = employees.filter(e => e.department_id === dept.id);
                            const deptCost = deptEmployees.reduce((sum, e) => sum + (parseFloat(e.current_salary) || 0), 0);
                            const deptAvg = deptEmployees.length > 0 ? deptCost / deptEmployees.length : 0;
                            const budgetPercent = totalPayroll > 0 ? ((deptCost / totalPayroll) * 100).toFixed(1) : 0;

                            return (
                                <tr key={dept.id}>
                                    <td className={styles.deptName}>{dept.name}</td>
                                    <td>{deptEmployees.length} funcionário(s)</td>
                                    <td>R$ {deptCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>R$ {deptAvg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ width: '220px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={styles.progressBarBg}>
                                                <div className={styles.progressBarFill} style={{ width: `${budgetPercent}%` }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{budgetPercent}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Tabela Resumo de Distribuição por Faixa de Compa-Ratio */}
            <div className={`${styles.tableCard} glass-panel`}>
                <h3 className={styles.cardTitle}>Distribuição por Faixa de Compa-Ratio (Equidade Salarial)</h3>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Classificação do Compa-Ratio</th>
                            <th>Faixa Percentual</th>
                            <th>Qtd. Colaboradores</th>
                            <th>Percentual da Base</th>
                            <th>Ação Recomendada de RH</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span style={{ color: '#ef4444', fontWeight: 700 }}>CRÍTICO</span></td>
                            <td>Abaixo de 80.0%</td>
                            <td>{employees.filter(e => e.compa_ratio && e.compa_ratio < 80).length}</td>
                            <td>{((employees.filter(e => e.compa_ratio && e.compa_ratio < 80).length / (employees.length || 1)) * 100).toFixed(1)}%</td>
                            <td className={styles.actionCritical}>Reajuste urgente para retenção de talentos</td>
                        </tr>
                        <tr>
                            <td><span style={{ color: '#f59e0b', fontWeight: 700 }}>ABAIXO DO MERCADO</span></td>
                            <td>80.0% a 94.9%</td>
                            <td>{employees.filter(e => e.compa_ratio && e.compa_ratio >= 80 && e.compa_ratio < 95).length}</td>
                            <td>{((employees.filter(e => e.compa_ratio && e.compa_ratio >= 80 && e.compa_ratio < 95).length / (employees.length || 1)) * 100).toFixed(1)}%</td>
                            <td className={styles.actionBelow}>Planejar reajuste de mérito progressivo</td>
                        </tr>
                        <tr>
                            <td><span style={{ color: '#10b981', fontWeight: 700 }}>ADEQUADO</span></td>
                            <td>95.0% a 105.0%</td>
                            <td>{employees.filter(e => e.compa_ratio && e.compa_ratio >= 95 && e.compa_ratio <= 105).length}</td>
                            <td>{((employees.filter(e => e.compa_ratio && e.compa_ratio >= 95 && e.compa_ratio <= 105).length / (employees.length || 1)) * 100).toFixed(1)}%</td>
                            <td className={styles.actionAdequate}>Manter acompanhamento de desempenho</td>
                        </tr>
                        <tr>
                            <td><span style={{ color: '#3b82f6', fontWeight: 700 }}>ACIMA DO MERCADO</span></td>
                            <td>105.1% a 120.0%</td>
                            <td>{employees.filter(e => e.compa_ratio && e.compa_ratio > 105 && e.compa_ratio <= 120).length}</td>
                            <td>{((employees.filter(e => e.compa_ratio && e.compa_ratio > 105 && e.compa_ratio <= 120).length / (employees.length || 1)) * 100).toFixed(1)}%</td>
                            <td className={styles.actionAbove}>Avaliar promoção para o próximo nível de cargo</td>
                        </tr>
                        <tr>
                            <td><span style={{ color: '#a855f7', fontWeight: 700 }}>EXCEDE O TETO</span></td>
                            <td>Acima de 120.0%</td>
                            <td>{employees.filter(e => e.compa_ratio && e.compa_ratio > 120).length}</td>
                            <td>{((employees.filter(e => e.compa_ratio && e.compa_ratio > 120).length / (employees.length || 1)) * 100).toFixed(1)}%</td>
                            <td className={styles.actionExceeds}>Congelar reajustes percentuais diretos</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Exportação padrão da tela de Relatórios
export default Reports;
