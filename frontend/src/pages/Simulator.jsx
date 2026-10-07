// Importação dos hooks do React para estado e efeitos
import React, { useState, useEffect } from 'react';
// Importação da instância do Axios para chamadas à API FastAPI
import api from '../api/axios';
// Importação dos ícones estilizados da biblioteca lucide-react
import { Sliders, DollarSign, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight, Save, RefreshCw, Users } from 'lucide-react';
// Importação dos estilos exclusivos da tela de Simulador
import styles from './Simulator.module.css';

// Componente Principal da Tela de Simulador de Reajustes Salariais & Promoções
const Simulator = () => {
    // Estado com a lista original de colaboradores do banco
    const [employees, setEmployees] = useState([]);
    // Estado com a lista de departamentos
    const [departments, setDepartments] = useState([]);
    // Estado com as configurações da empresa
    const [settings, setSettings] = useState({});
    // Estado de carregamento dos dados
    const [loading, setLoading] = useState(true);

    // Filtros de seleção para simulação
    const [targetDept, setTargetDept] = useState('ALL');
    const [targetStatus, setTargetStatus] = useState('ALL');
    const [raisePercent, setRaisePercent] = useState(5.0);

    // Estado indicando se os reajustes simulados estão sendo efetivados no banco de dados
    const [isApplying, setIsApplying] = useState(false);
    // Mensagem de sucesso após efetivar
    const [successMsg, setSuccessMsg] = useState('');

    // Busca colaboradores, departamentos e configurações da API ao carregar
    const loadData = () => {
        setLoading(true);
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
        .catch(err => console.error('Erro ao carregar dados do simulador:', err))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    // 1. Filtra quais colaboradores serão afetados pela simulação
    const targetEmployees = employees.filter(emp => {
        // Filtro por departamento
        if (targetDept !== 'ALL' && emp.department_id !== parseInt(targetDept)) {
            return false;
        }
        // Filtro por classificação de Compa-Ratio
        if (targetStatus === 'CRITICAL' && (!emp.compa_ratio || emp.compa_ratio >= 80)) {
            return false;
        }
        if (targetStatus === 'BELOW' && (!emp.compa_ratio || emp.compa_ratio < 80 || emp.compa_ratio >= 95)) {
            return false;
        }
        return true;
    });

    // 2. Calcula a simulação individual para cada colaborador selecionado
    const simulatedList = targetEmployees.map(emp => {
        const currentSalary = parseFloat(emp.current_salary) || 0;
        const increaseFactor = 1 + (parseFloat(raisePercent) || 0) / 100;
        const newSalary = roundTwo(currentSalary * increaseFactor);
        const salaryDiff = roundTwo(newSalary - currentSalary);

        // Recálculo aproximado do novo Compa-Ratio proporcional
        const oldCR = emp.compa_ratio || 100;
        const newCR = roundOne(oldCR * increaseFactor);

        return {
            ...emp,
            currentSalary,
            newSalary,
            salaryDiff,
            oldCR,
            newCR
        };
    });

    // 3. Totais Financeiros Globais da Simulação
    const currentTotalPayroll = employees.reduce((sum, e) => sum + (parseFloat(e.current_salary) || 0), 0);
    const totalSimulatedIncrease = simulatedList.reduce((sum, e) => sum + e.salaryDiff, 0);
    const newTotalPayroll = currentTotalPayroll + totalSimulatedIncrease;
    const budgetCap = settings.payroll_budget_cap || 500000;
    const isOverBudget = newTotalPayroll > budgetCap;

    // Helper para arredondar para 2 casas decimais
    function roundTwo(val) {
        return Math.round(val * 100) / 100;
    }
    // Helper para arredondar para 1 casa decimal
    function roundOne(val) {
        return Math.round(val * 10) / 10;
    }

    // Função para Efetivar e Aplicar os reajustes Simulados diretamente no Banco de Dados
    const handleApplyRaises = async () => {
        if (simulatedList.length === 0) return;
        if (!window.confirm(`Confirma a aplicação do reajuste de ${raisePercent}% para ${simulatedList.length} colaborador(es)? Esta ação atualizará os salários reais no banco de dados e gerará registros de auditoria.`)) {
            return;
        }

        setIsApplying(true);
        setSuccessMsg('');

        try {
            // Executa as atualizações de salário sequencialmente ou via endpoint batch
            for (const item of simulatedList) {
                await api.put(`/employees/${item.id}`, {
                    current_salary: item.newSalary
                });
            }

            setSuccessMsg(`Sucesso! ${simulatedList.length} colaborador(es) tiveram seus salários atualizados com reajuste de ${raisePercent}%.`);
            // Recarrega os dados do banco para refletir o novo cenário real
            loadData();
        } catch (err) {
            console.error('Erro ao aplicar reajustes no banco:', err);
            alert('Falha ao efetivar reajustes salariais.');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Cabeçalho da página do Simulador */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Simulador de Reajustes & Mérito</h1>
                    <p className={styles.subtitle}>Planejamento estratégico de aumentos salariais com impacto orçamentário e projeção de Compa-Ratio em tempo real</p>
                </div>
            </div>

            {/* Alerta de sucesso ao efetivar os reajustes */}
            {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: '#6ee7b7', fontWeight: 600, fontSize: '14px' }}>
                    <CheckCircle2 size={20} />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Grid Principal: Parâmetros da Simulação à Esquerda + Resumo e Preview à Direita */}
            <div className={styles.simulatorGrid}>
                {/* Painel de Parâmetros e Filtros de Simulação */}
                <div className={`${styles.controlsCard} glass-panel`}>
                    <h3 className={styles.sectionTitle}>
                        <Sliders size={18} style={{ color: '#8b5cf6' }} />
                        <span>Parâmetros de Reajuste</span>
                    </h3>

                    {/* Filtro de Departamento Alvo */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Departamento Alvo</label>
                        <select
                            className={styles.selectInput}
                            value={targetDept}
                            onChange={(e) => setTargetDept(e.target.value)}
                        >
                            <option value="ALL">Todos os Departamentos</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Grupo/Elegibilidade */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Público Alvo (Compa-Ratio)</label>
                        <select
                            className={styles.selectInput}
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value)}
                        >
                            <option value="ALL">Todos da Base Selecionada</option>
                            <option value="CRITICAL">Apenas Críticos (&lt; 80% do mercado)</option>
                            <option value="BELOW">Apenas Defasados (80% a 95% do mercado)</option>
                        </select>
                    </div>

                    {/* Percentual de Reajuste Aplicado */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Percentual de Reajuste (%)</label>
                        <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            max="100"
                            className={styles.textInput}
                            value={raisePercent}
                            onChange={(e) => setRaisePercent(e.target.value)}
                        />
                    </div>

                    {/* Resumo da Seleção de Colaboradores Elegíveis */}
                    <div className={styles.selectionSummary}>
                        <div>Colaboradores Selecionados: <strong>{simulatedList.length}</strong> de {employees.length}</div>
                    </div>

                    {/* Botão para Efetivar Reajustes no Banco de Dados */}
                    <button
                        className={styles.applyBtn}
                        onClick={handleApplyRaises}
                        disabled={simulatedList.length === 0 || isApplying || isOverBudget}
                    >
                        <Save size={18} />
                        <span>{isApplying ? 'Efetivando...' : 'Efetivar Reajustes no Banco'}</span>
                    </button>

                    {isOverBudget && (
                        <p style={{ color: '#fca5a5', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                            ⚠️ Não é possível efetivar enquanto a nova folha ultrapassar o teto orçamentário.
                        </p>
                    )}
                </div>

                {/* Área de Preview de Impacto Financeiro e Tabela de Simulação */}
                <div className={`${styles.previewCard} glass-panel`}>
                    <h3 className={styles.sectionTitle}>
                        <TrendingUp size={18} style={{ color: '#10b981' }} />
                        <span>Projeção de Impacto Orçamentário</span>
                    </h3>

                    {/* Métricas Financeiras Simuladas */}
                    <div className={styles.impactGrid}>
                        {/* Caixa 1: Aumento Total da Folha */}
                        <div className={styles.impactBox}>
                            <span className={styles.impactLabel}>Aumento Total na Folha</span>
                            <span className={styles.impactValue} style={{ color: '#10b981' }}>
                                + R$ {totalSimulatedIncrease.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={styles.subText}>Mensal recorrente</span>
                        </div>

                        {/* Caixa 2: Nova Folha Salarial Total */}
                        <div className={styles.impactBox}>
                            <span className={styles.impactLabel}>Nova Folha Salarial</span>
                            <span className={styles.impactValue}>
                                R$ {newTotalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={styles.subText}>Anterior: R$ {currentTotalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* Caixa 3: Status em Relação ao Teto */}
                        <div className={styles.impactBox}>
                            <span className={styles.impactLabel}>Uso do Teto Orçamentário</span>
                            <span className={styles.impactValue} style={{ color: isOverBudget ? '#ef4444' : '#6ee7b7' }}>
                                {((newTotalPayroll / budgetCap) * 100).toFixed(1)}%
                            </span>
                            <span className={styles.subText}>Teto: R$ {budgetCap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Tabela de Preview Individual por Colaborador */}
                    <div className={styles.tableScrollWrapper}>
                        <table className={styles.simTable}>
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Colaborador</th>
                                    <th>Salário Atual</th>
                                    <th>Salário Simulado</th>
                                    <th>Aumento (R$)</th>
                                    <th>Compa-Ratio Novo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {simulatedList.length > 0 ? (
                                    simulatedList.map(emp => (
                                        <tr key={emp.id}>
                                            <td style={{ fontWeight: 600, color: '#8b5cf6' }}>{emp.registration_number}</td>
                                            <td className={styles.empName}>{emp.full_name}</td>
                                            <td>R$ {emp.currentSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ color: '#10b981', fontWeight: 600 }}>R$ {emp.newSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ color: '#10b981' }}>+ R$ {emp.salaryDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className={styles.oldCr}>{emp.oldCR}%</span>
                                                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                                                    <strong className={emp.newCR >= 95 ? styles.crGood : styles.crWarning}>{emp.newCR}%</strong>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                            Nenhum colaborador corresponde aos filtros selecionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Exportação padrão do componente Simulador
export default Simulator;
