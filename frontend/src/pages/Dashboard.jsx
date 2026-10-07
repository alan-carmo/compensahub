// Importação dos hooks do React para gerenciar estado e efeitos colaterais
import React, { useEffect, useState } from 'react';
// Importação da instância pré-configurada do Axios para requisições com o Backend
import api from '../api/axios';
// Importação dos ícones do Lucide React para os cards estatísticos
import { Users, AlertTriangle, DollarSign } from 'lucide-react';
// Importação dos componentes de gráfico de barras da biblioteca Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Importação dos estilos exclusivos via CSS Modules
import styles from './Dashboard.module.css';

// Componente Principal da Tela de Dashboard e Indicadores Executivos
const Dashboard = () => {
  // Estado para armazenar a lista de colaboradores vinda da API
  const [employees, setEmployees] = useState([]);
  // Estado para armazenar a lista de departamentos vinda da API
  const [departments, setDepartments] = useState([]);
  // Estado para controlar o carregamento dos dados
  const [loading, setLoading] = useState(true);

  // Efeito executado ao carregar a tela para buscar colaboradores e departamentos reais do backend
  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/departments/')
    ])
      .then(([empRes, deptRes]) => {
        // Atualiza a lista de colaboradores com dados reais da API Python
        setEmployees(empRes.data);
        // Atualiza a lista de departamentos cadastrados no banco de dados
        setDepartments(deptRes.data);
      })
      .catch(err => {
        console.error("Erro ao carregar dados do Dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Cálculo da folha mensal estimada (soma real do salário atual de todos os colaboradores)
  const totalPayroll = employees.reduce((sum, emp) => sum + (parseFloat(emp.current_salary) || 0), 0);

  // Filtro de colaboradores em situação crítica de Compa-Ratio (< 80% do mercado)
  const criticos = employees.filter(e => 
    e.compa_ratio_status?.includes("CRÍTICO") || (e.compa_ratio && e.compa_ratio < 80)
  ).length;

  // Construção dinâmica dos dados do gráfico com base APENAS nos departamentos CADASTRADOS no sistema
  const chartData = departments.map(dept => {
    // Filtra colaboradores pertencentes a este departamento específico
    const deptEmployees = employees.filter(emp => emp.department_id === dept.id);
    // Calcula o custo folha total deste departamento somando o salário real dos funcionários cadastrados
    const totalDeptCost = deptEmployees.reduce((sum, emp) => sum + (parseFloat(emp.current_salary) || 0), 0);
    
    return {
      name: dept.name,
      custo: totalDeptCost,
      quantidade: deptEmployees.length
    };
  });

  // Ordena os colaboradores para priorizar na lista aqueles com menor Compa-Ratio (maior necessidade de atenção)
  const sortedEmployees = [...employees].sort((a, b) => (a.compa_ratio || 0) - (b.compa_ratio || 0));

  // Função para retornar a classe de cor do badge com base no status do Compa-Ratio
  const getBadgeClass = (emp) => {
    const ratio = emp.compa_ratio || 0;
    if (ratio < 80 || emp.compa_ratio_status?.includes("CRÍTICO")) return styles.badgeDanger;
    if (ratio < 95 || emp.compa_ratio_status?.includes("ABAIXO")) return styles.badgeWarning;
    if (ratio <= 105 || emp.compa_ratio_status?.includes("ADEQUADO")) return styles.badgeSuccess;
    return styles.badgeInfo;
  };

  return (
    <div className={styles.dashboard}>
      {/* Grid de Cards Estatísticos do Topo */}
      <div className={styles.statsGrid}>
        {/* Card: Total de Funcionários Cadastrados */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Total de Funcionários</p>
            <h3>{employees.length}</h3>
          </div>
        </div>
        
        {/* Card: Folha Mensal Estimada (Valor Real Somado de Todos os Colaboradores) */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Folha Mensal Estimada</p>
            <h3>R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Card: Compa-Ratio Crítico (Quantidade de Colaboradores Defasados) */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Compa-Ratio Crítico</p>
            <h3 style={{ color: criticos > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{criticos}</h3>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos e Painel de Atenção */}
      <div className={styles.chartsGrid}>
        {/* Gráfico de Barras: Custo Real por Departamento */}
        <div className={`${styles.chartContainer} glass-panel`}>
          <h3>Custo por Departamento (Real)</h3>
          <div className={styles.chartWrapper}>
            {loading ? (
              <p className={styles.empty}>Carregando indicadores...</p>
            ) : chartData.length === 0 ? (
              <p className={styles.empty}>Nenhum departamento cadastrado para exibir no gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis 
                    domain={[0, 1000000]}
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(val) => val >= 1000000 ? 'R$ 1M' : `R$ ${(val / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }} 
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                      'Custo Folha Mensal'
                    ]}
                    labelFormatter={(label) => `Departamento: ${label}`}
                  />
                  <Bar dataKey="custo" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--secondary)" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Painel Lateral: Lista de Colaboradores e Compa-Ratio */}
        <div className={`${styles.listContainer} glass-panel`}>
          <h3>Atenção Necessária (Compa-Ratio)</h3>
          {loading ? (
            <p className={styles.empty}>Carregando colaboradores...</p>
          ) : employees.length === 0 ? (
            <p className={styles.empty}>Nenhum colaborador cadastrado.</p>
          ) : (
            <div className={styles.employeeList}>
              {sortedEmployees.map(emp => (
                <div key={emp.id} className={styles.employeeItem}>
                  <div>
                    <h4>{emp.full_name}</h4>
                    <small>{emp.registration_number} {emp.department_name ? `• ${emp.department_name}` : ''}</small>
                  </div>
                  <span className={`${styles.badge} ${getBadgeClass(emp)}`}>
                    {emp.compa_ratio ? `${emp.compa_ratio}%` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exporta o componente Dashboard como padrão
export default Dashboard;
