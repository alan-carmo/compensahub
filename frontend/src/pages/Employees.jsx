// Importação dos hooks básicos do React (Estado, Efeitos)
import React, { useEffect, useState } from 'react';
// Importação da instância pré-configurada do Axios para requisições HTTP
import api from '../api/axios';
// Importação dos ícones do Lucide React utilizados na tela de Funcionários
import { Search, Calculator, Download, Plus, Users, X, Pencil, Trash2, Filter, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
// Importação da biblioteca jsPDF para geração de relatórios em formato PDF
import jsPDF from 'jspdf';
// Importação do plugin autoTable do jsPDF para geração de tabelas estilizadas em PDF
import autoTable from 'jspdf-autotable';
// Importação dos estilos exclusivos em CSS Modules
import styles from './Employees.module.css';

// Componente Funcional Principal: Quadro de Colaboradores e Simulador Salarial
const Employees = () => {
  // Lista dos colaboradores cadastrados retornada da API
  const [employees, setEmployees] = useState([]);
  // Lista de departamentos para os selects dos modais
  const [departments, setDepartments] = useState([]);
  // Lista de cargos para os selects dos modais
  const [positions, setPositions] = useState([]);
  // Termo digitado na caixa de pesquisa principal
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados do Simulador de Impacto Financeiro (Mérito Salarial)
  const [simulationPercent, setSimulationPercent] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);

  // Estados de controle do Modal de Novo Funcionário (Criação)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Estados de controle do Modal de Edição de Funcionário
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ESTADOS DOS FILTROS E ORDENAÇÃO DE CABEÇALHO (ESTILO EXCEL)
  // Estado para armazenar qual coluna está sendo ordenada e a direção (asc/desc)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  // Estado para controlar qual popover de filtro de coluna está aberto
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  // Estado para armazenar os valores selecionados no filtro de cada coluna { colKey: [valores] }
  const [columnFilters, setColumnFilters] = useState({});
  // Estado para busca de valores dentro do popover de filtro { colKey: termoBusca }
  const [popoverSearch, setPopoverSearch] = useState({});

  // Estado do formulário de criação
  const [formData, setFormData] = useState({
    full_name: '',
    registration_number: '',
    department_id: '',
    position_id: '',
    current_salary: '',
    hire_date: new Date().toISOString().split('T')[0]
  });

  // Estado do formulário de edição
  const [editFormData, setEditFormData] = useState({
    id: null,
    full_name: '',
    registration_number: '',
    department_id: '',
    position_id: '',
    current_salary: '',
    hire_date: '',
    status: 'ACTIVE'
  });
  
  // Estado de carregamento assíncrono
  const [loading, setLoading] = useState(false);
  // Estado de mensagens de erro do modal
  const [errorMessage, setErrorMessage] = useState('');

  // Função para buscar os colaboradores na API backend
  const fetchEmployees = () => {
    api.get('/employees').then(res => setEmployees(res.data)).catch(console.error);
  };

  // Função para carregar departamentos e cargos cadastrados para os formulários
  const fetchDepartmentsAndPositions = () => {
    api.get('/departments/').then(res => setDepartments(res.data)).catch(console.error);
    api.get('/positions/').then(res => setPositions(res.data)).catch(console.error);
  };

  // Executa o carregamento inicial dos dados assim que a tela abre
  useEffect(() => {
    fetchEmployees();
    fetchDepartmentsAndPositions();
  }, []);

  // Event listener para fechar o popover de filtro ao clicar em qualquer área fora da tabela
  useEffect(() => {
    const handleOutsideClick = () => setActiveFilterCol(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Helper para extrair o valor string/formatado de cada coluna de um colaborador
  const getColValue = (emp, colKey) => {
    if (colKey === 'registration_number') return emp.registration_number || '-';
    if (colKey === 'full_name') return emp.full_name || '-';
    if (colKey === 'department_name') {
      return emp.department_name || departments.find(d => d.id === emp.department_id)?.name || 'Sem departamento';
    }
    if (colKey === 'position_title') {
      return emp.position_title || positions.find(p => p.id === emp.position_id)?.title || 'Sem cargo';
    }
    if (colKey === 'current_salary') {
      return `R$ ${(emp.current_salary || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }
    if (colKey === 'compa_ratio') {
      return emp.compa_ratio ? `${emp.compa_ratio}%` : '-';
    }
    if (colKey === 'compa_ratio_status') return emp.compa_ratio_status || 'N/A';
    return '';
  };

  // Obtém lista ordenada de todos os valores únicos presentes em uma coluna específica
  const getUniqueValues = (colKey) => {
    const vals = employees.map(emp => getColValue(emp, colKey));
    return Array.from(new Set(vals)).sort();
  };

  // Alterna a ordenação de uma coluna (asc -> desc -> limpa)
  const handleSort = (colKey, direction) => {
    if (sortConfig.key === colKey && sortConfig.direction === direction) {
      setSortConfig({ key: null, direction: null });
    } else {
      setSortConfig({ key: colKey, direction });
    }
  };

  // Limpa os filtros aplicados a uma coluna específica
  const clearColumnFilter = (colKey) => {
    const updated = { ...columnFilters };
    delete updated[colKey];
    setColumnFilters(updated);
  };

  // Alterna a seleção de um único item no checklist do filtro de coluna
  const toggleValSelect = (colKey, val) => {
    const allVals = getUniqueValues(colKey);
    const currentList = columnFilters[colKey] !== undefined ? columnFilters[colKey] : [...allVals];
    let updated;
    if (currentList.includes(val)) {
      updated = currentList.filter(v => v !== val);
    } else {
      updated = [...currentList, val];
    }
    setColumnFilters({ ...columnFilters, [colKey]: updated });
  };

  // Alterna a seleção de "(Selecionar Tudo)" no checklist do filtro de coluna
  const toggleSelectAll = (colKey, allVals, isChecked) => {
    if (isChecked) {
      const updated = { ...columnFilters };
      delete updated[colKey];
      setColumnFilters(updated);
    } else {
      setColumnFilters({ ...columnFilters, [colKey]: [] });
    }
  };

  // Handler enviado quando o formulário de cadastro de novo colaborador é submetido
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.registration_number || !formData.department_id || !formData.position_id || !formData.current_salary) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await api.post('/employees/', {
        full_name: formData.full_name,
        registration_number: formData.registration_number,
        department_id: Number(formData.department_id),
        position_id: Number(formData.position_id),
        current_salary: parseFloat(formData.current_salary),
        hire_date: formData.hire_date,
        status: "ACTIVE"
      });

      setFormData({
        full_name: '',
        registration_number: '',
        department_id: '',
        position_id: '',
        current_salary: '',
        hire_date: new Date().toISOString().split('T')[0]
      });
      setIsCreateModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      handleError(err, "Erro ao cadastrar funcionário.");
    } finally {
      setLoading(false);
    }
  };

  // Abre o modal de EDIÇÃO com os dados pré-preenchidos do colaborador selecionado
  const handleOpenEdit = (emp) => {
    setEditFormData({
      id: emp.id,
      full_name: emp.full_name,
      registration_number: emp.registration_number,
      department_id: emp.department_id,
      position_id: emp.position_id,
      current_salary: emp.current_salary,
      hire_date: emp.hire_date,
      status: emp.status
    });
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  // Submete o formulário de EDIÇÃO atualizando o colaborador no backend
  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!editFormData.full_name || !editFormData.registration_number || !editFormData.department_id || !editFormData.position_id || !editFormData.current_salary) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await api.put(`/employees/${editFormData.id}`, {
        full_name: editFormData.full_name,
        registration_number: editFormData.registration_number,
        department_id: Number(editFormData.department_id),
        position_id: Number(editFormData.position_id),
        current_salary: parseFloat(editFormData.current_salary),
        hire_date: editFormData.hire_date,
        status: editFormData.status
      });

      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      handleError(err, "Erro ao atualizar informações do funcionário.");
    } finally {
      setLoading(false);
    }
  };

  // Função para EXCLUIR um colaborador do sistema
  const handleDeleteEmployee = async (emp) => {
    if (window.confirm(`Tem certeza que deseja excluir o colaborador "${emp.full_name}" (Matrícula: ${emp.registration_number})?`)) {
      try {
        await api.delete(`/employees/${emp.id}`);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir colaborador do sistema.");
      }
    }
  };

  // Trata mensagens de erro HTTP amigáveis
  const handleError = (err, defaultMsg) => {
    let msg = defaultMsg;
    if (err.message === "Network Error" || !err.response) {
      msg = "Conexão recusada (Network Error). Verifique se o servidor backend (FastAPI) está rodando na porta 8000.";
    } else if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === 'string') {
        if (detail.includes("registration number already exists")) {
          msg = "Já existe um colaborador cadastrado com esta matrícula.";
        } else {
          msg = detail;
        }
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg).join(', ');
      }
    } else if (err.message) {
      msg = err.message;
    }
    setErrorMessage(msg);
  };

  // Aplicação da Filtragem (Busca Global + Filtros Individuais de Cada Coluna)
  const filteredEmployees = employees.filter(emp => {
    // 1. Filtro pela caixa de busca global
    const searchLower = searchTerm.toLowerCase();
    const matchesGlobal = !searchTerm || 
      emp.full_name.toLowerCase().includes(searchLower) ||
      emp.registration_number.toLowerCase().includes(searchLower) ||
      getColValue(emp, 'department_name').toLowerCase().includes(searchLower) ||
      getColValue(emp, 'position_title').toLowerCase().includes(searchLower);

    if (!matchesGlobal) return false;

    // 2. Filtro pelos checklists das colunas individuais
    for (const [colKey, selectedVals] of Object.entries(columnFilters)) {
      if (selectedVals && Array.isArray(selectedVals)) {
        const val = getColValue(emp, colKey);
        if (!selectedVals.includes(val)) return false;
      }
    }

    return true;
  });

  // Aplicação da Ordenação (A-Z / Z-A / Menor-Maior)
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const colKey = sortConfig.key;

    let valA, valB;
    if (colKey === 'current_salary') {
      valA = parseFloat(a.current_salary) || 0;
      valB = parseFloat(b.current_salary) || 0;
    } else if (colKey === 'compa_ratio') {
      valA = parseFloat(a.compa_ratio) || 0;
      valB = parseFloat(b.compa_ratio) || 0;
    } else {
      valA = getColValue(a, colKey).toString().toLowerCase();
      valB = getColValue(b, colKey).toString().toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Lógica do Simulador Financeiro de Mérito Salarial
  const totalPayroll = employees.reduce((acc, emp) => acc + (parseFloat(emp.current_salary) || 0), 0);
  const eligibleForRaise = employees.filter(e => e.compa_ratio < 95);
  const increaseAmount = eligibleForRaise.reduce((acc, emp) => {
    return acc + (emp.current_salary * (simulationPercent / 100));
  }, 0);
  const newTotalPayroll = totalPayroll + increaseAmount;

  // Função para exportação de Relatório Executivo em PDF incluindo todas as colunas
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Relatorio de Gestao Salarial - CompensaHub", 14, 22);
      
      doc.setFontSize(11);
      if (simulationPercent > 0) {
        doc.text(`Percentual Simulado: ${simulationPercent}%`, 14, 30);
        doc.text(`Impacto Adicional (Mensal): R$ ${increaseAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 36);
        doc.text(`Nova Folha Projetada: R$ ${newTotalPayroll.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 42);
        doc.text(`Colaboradores Elegiveis (Abaixo de 95% do mercado): ${eligibleForRaise.length}`, 14, 48);
      } else {
        doc.text(`Folha de Pagamento Atual: R$ ${totalPayroll.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 30);
        doc.text(`Total de Colaboradores: ${employees.length}`, 14, 36);
      }
      
      const tableColumn = ["Matricula", "Nome", "Departamento", "Cargo", "Salario Atual", "Salario Simulado", "Compa-Ratio"];
      const tableRows = [];

      sortedEmployees.forEach(emp => {
        const isEligible = emp.compa_ratio < 95;
        const simulatedSalary = showSimulation && simulationPercent > 0 && isEligible 
          ? emp.current_salary * (1 + (simulationPercent / 100))
          : emp.current_salary;
          
        const deptName = getColValue(emp, 'department_name');
        const posTitle = getColValue(emp, 'position_title');

        const empData = [
          emp.registration_number,
          emp.full_name,
          deptName,
          posTitle,
          `R$ ${emp.current_salary.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          (simulationPercent > 0 && isEligible) ? `R$ ${simulatedSalary.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : "-",
          `${emp.compa_ratio ? emp.compa_ratio : '-'}%`
        ];
        tableRows.push(empData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: simulationPercent > 0 ? 55 : 44,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      });

      doc.save(simulationPercent > 0 ? `simulacao_reajuste_${simulationPercent}pct.pdf` : `relatorio_colaboradores.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF: " + (err.message || err));
    }
  };

  // Filtra cargos com base no departamento selecionado (Criação)
  const filteredPositionsForCreateModal = formData.department_id 
    ? positions.filter(p => p.department_id === Number(formData.department_id))
    : positions;

  // Filtra cargos com base no departamento selecionado (Edição)
  const filteredPositionsForEditModal = editFormData.department_id 
    ? positions.filter(p => p.department_id === Number(editFormData.department_id))
    : positions;

  // Ao alterar cargo no modal de criação, preenche o salário automaticamente
  const handleCreatePositionChange = async (posId) => {
    setFormData(prev => ({ ...prev, position_id: posId }));
    if (!posId) return;

    try {
      const res = await api.get(`/salary-bands/position/${posId}`);
      const bands = res.data;
      const currentBand = bands.find(b => b.is_current) || bands[0];
      if (currentBand && currentBand.mid_salary) {
        setFormData(prev => ({
          ...prev,
          position_id: posId,
          current_salary: currentBand.mid_salary
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar faixa salarial do cargo:", err);
    }
  };

  // Ao alterar cargo no modal de edição, preenche o salário automaticamente
  const handleEditPositionChange = async (posId) => {
    setEditFormData(prev => ({ ...prev, position_id: posId }));
    if (!posId) return;

    try {
      const res = await api.get(`/salary-bands/position/${posId}`);
      const bands = res.data;
      const currentBand = bands.find(b => b.is_current) || bands[0];
      if (currentBand && currentBand.mid_salary) {
        setEditFormData(prev => ({
          ...prev,
          position_id: posId,
          current_salary: currentBand.mid_salary
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar faixa salarial do cargo:", err);
    }
  };

  // Renderiza cada cabeçalho de coluna da tabela com popover interativo de filtro e ordenação estilo Excel
  const renderFilterableHeader = (colKey, label) => {
    const allUnique = getUniqueValues(colKey);
    const selectedList = columnFilters[colKey] !== undefined ? columnFilters[colKey] : allUnique;
    const isFiltered = columnFilters[colKey] !== undefined && columnFilters[colKey].length < allUnique.length;
    const isSorted = sortConfig.key === colKey;
    const searchVal = popoverSearch[colKey] || '';
    const visibleVals = allUnique.filter(v => v.toLowerCase().includes(searchVal.toLowerCase()));
    const isAllChecked = allUnique.length > 0 && allUnique.every(v => selectedList.includes(v));

    return (
      <th key={colKey} className={styles.filterableHeader}>
        <div className={styles.headerContent}>
          <span>{label}</span>
          <button 
            className={`${styles.filterBtn} ${(isFiltered || isSorted) ? styles.filterActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveFilterCol(activeFilterCol === colKey ? null : colKey);
            }}
            title={`Filtrar / Classificar por ${label}`}
          >
            <Filter size={13} />
            {isSorted && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
          </button>
        </div>

        {/* POPOVER ESTILO EXCEL DE FILTRO E ORDENAÇÃO */}
        {activeFilterCol === colKey && (
          <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
            {/* Opções de Classificação de A a Z / Z a A */}
            <div className={styles.popoverSection}>
              <button 
                className={`${styles.popoverItem} ${isSorted && sortConfig.direction === 'asc' ? styles.activeSort : ''}`}
                onClick={() => handleSort(colKey, 'asc')}
              >
                <ArrowUp size={15} /> 
                {colKey === 'current_salary' || colKey === 'compa_ratio' ? 'Classificar do Menor para Maior' : 'Classificar de A a Z'}
              </button>
              <button 
                className={`${styles.popoverItem} ${isSorted && sortConfig.direction === 'desc' ? styles.activeSort : ''}`}
                onClick={() => handleSort(colKey, 'desc')}
              >
                <ArrowDown size={15} /> 
                {colKey === 'current_salary' || colKey === 'compa_ratio' ? 'Classificar do Maior para Menor' : 'Classificar de Z a A'}
              </button>
            </div>

            <div className={styles.popoverDivider} />

            {/* Botão de Limpar Filtro desta Coluna */}
            <button 
              className={styles.popoverItem}
              onClick={() => clearColumnFilter(colKey)}
            >
              <RotateCcw size={14} /> Limpar Filtro de "{label}"
            </button>

            <div className={styles.popoverDivider} />

            {/* Campo de Pesquisa Dentro do Popover */}
            <div className={styles.popoverSearchBox}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                value={searchVal}
                onChange={(e) => setPopoverSearch({ ...popoverSearch, [colKey]: e.target.value })}
              />
            </div>

            {/* Checklist com Selecionar Tudo e Valores Únicos */}
            <div className={styles.popoverCheckboxList}>
              <label className={styles.checkboxItem}>
                <input 
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => toggleSelectAll(colKey, allUnique, e.target.checked)}
                />
                <strong>(Selecionar Tudo)</strong>
              </label>

              {visibleVals.map((val, idx) => (
                <label key={idx} className={styles.checkboxItem}>
                  <input 
                    type="checkbox"
                    checked={selectedList.includes(val)}
                    onChange={() => toggleValSelect(colKey, val)}
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>

            <div className={styles.popoverActions}>
              <button className={styles.btnApply} onClick={() => setActiveFilterCol(null)}>Fechar</button>
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div className={styles.container}>
      
      {/* CABEÇALHO DA PÁGINA COM BOTÃO DE NOVO COLABORADOR */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <div className={styles.iconWrapper}><Users size={24} /></div>
          <div>
            <h2>Quadro de Colaboradores</h2>
            <p>Gerencie salários, matrículas e análise de Compa-Ratio da equipe</p>
          </div>
        </div>
        <button className={styles.addButton} onClick={() => {
          setErrorMessage('');
          setIsCreateModalOpen(true);
        }}>
          <Plus size={18} /> Novo Colaborador
        </button>
      </div>

      {/* SIMULADOR DE IMPACTO FINANCEIRO */}
      <div className={`${styles.simulatorCard} glass-panel`}>
        <div className={styles.simHeader}>
          <div className={styles.simTitle}>
            <div className={styles.simIcon}><Calculator size={20} /></div>
            <div>
              <h3>Simulador de Impacto Financeiro</h3>
              <p>Calcule o custo de reajustar salários de colaboradores defasados (Compa-Ratio &lt; 95%)</p>
            </div>
          </div>
          
          <button className={styles.exportBtn} onClick={exportToPDF}>
            <Download size={18} /> Exportar PDF
          </button>
        </div>
        
        <div className={styles.simBody}>
          <div className={styles.inputGroup}>
            <label>Aplicar Reajuste de (%)</label>
            <input 
              type="number" 
              min="0" max="100" 
              value={simulationPercent}
              onChange={(e) => {
                setSimulationPercent(Number(e.target.value));
                setShowSimulation(true);
              }}
              className={styles.input}
            />
          </div>
          
          <div className={styles.resultsGrid}>
            <div className={styles.resultItem}>
              <span>Folha Atual (Mês)</span>
              <strong>R$ {totalPayroll.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>Custo Adicional</span>
              <strong className={styles.costIncrease}>+ R$ {increaseAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>Nova Folha Projetada</span>
              <strong className={styles.newTotal}>R$ {newTotalPayroll.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>Elegíveis (Abaixo do Mercado)</span>
              <strong>{eligibleForRaise.length} Colaboradores</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DA TABELA DE COLABORADORES */}
      <div className={`${styles.tableCard} glass-panel`}>
        <div className={styles.tableHeader}>
          <h3>Colaboradores ({sortedEmployees.length})</h3>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome, matrícula, cargo ou departamento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {renderFilterableHeader('registration_number', 'Matrícula')}
                {renderFilterableHeader('full_name', 'Colaborador')}
                {renderFilterableHeader('department_name', 'Departamento')}
                {renderFilterableHeader('position_title', 'Cargo')}
                {renderFilterableHeader('current_salary', 'Salário Mensal')}
                {renderFilterableHeader('compa_ratio', 'Compa-Ratio')}
                {renderFilterableHeader('compa_ratio_status', 'Análise de Status')}
                <th style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map(emp => {
                const isEligible = emp.compa_ratio < 95;
                const simulatedSalary = showSimulation && simulationPercent > 0 && isEligible 
                  ? emp.current_salary * (1 + (simulationPercent / 100))
                  : emp.current_salary;
                  
                const isCritical = emp.compa_ratio_status?.includes("CRÍTICO");
                const isGood = emp.compa_ratio_status?.includes("ADEQUADO");

                const deptName = getColValue(emp, 'department_name');
                const posTitle = getColValue(emp, 'position_title');

                return (
                  <tr key={emp.id} className={showSimulation && simulationPercent > 0 && isEligible ? styles.simulatedRow : ''}>
                    <td><strong>{emp.registration_number}</strong></td>
                    <td>{emp.full_name}</td>
                    <td>{deptName}</td>
                    <td>{posTitle}</td>
                    <td>
                      R$ {emp.current_salary.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      {showSimulation && simulationPercent > 0 && isEligible && (
                        <span className={styles.newSalaryBadge}>
                          👉 R$ {simulatedSalary.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.ratioBar}>
                        <div 
                          className={styles.ratioFill} 
                          style={{ 
                            width: `${Math.min(emp.compa_ratio || 0, 120)}%`,
                            backgroundColor: isCritical ? 'var(--danger)' : isGood ? 'var(--success)' : 'var(--warning)'
                          }}
                        ></div>
                        <span>{emp.compa_ratio ? `${emp.compa_ratio}%` : '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${isCritical ? styles.danger : isGood ? styles.success : styles.warning}`}>
                        {emp.compa_ratio_status || 'N/A'}
                      </span>
                    </td>
                    {/* Botões de Ação para Editar e Excluir Colaborador */}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          title="Editar Colaborador" 
                          onClick={() => handleOpenEdit(emp)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--warning)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <Pencil size={16} />
                        </button>

                        <button 
                          title="Excluir Colaborador" 
                          onClick={() => handleDeleteEmployee(emp)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--danger)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedEmployees.length === 0 && (
            <div className={styles.emptyState}>Nenhum funcionário encontrado na busca.</div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO DE NOVO COLABORADOR */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Colaborador</h3>
              <button className="modal-close-btn" onClick={() => { setIsCreateModalOpen(false); setErrorMessage(''); }}>
                <X size={20} />
              </button>
            </div>
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.9rem'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            <form onSubmit={handleCreateEmployee} className="modal-form">
              <div className="modal-field">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Ana Maria Silva" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Matrícula / Código *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: EMP005" 
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Departamento *</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value, position_id: '' })}
                >
                  <option value="">Selecione o departamento...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Cargo *</label>
                <select
                  required
                  value={formData.position_id}
                  onChange={(e) => handleCreatePositionChange(e.target.value)}
                >
                  <option value="">Selecione o cargo...</option>
                  {filteredPositionsForCreateModal.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.title} ({pos.level})</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Salário Atual (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="Ex: 8500.00" 
                  value={formData.current_salary}
                  onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  💡 Preenchido automaticamente com o Salário de Mercado do cargo (pode ser ajustado).
                </span>
              </div>

              <div className="modal-field">
                <label>Data de Admissão *</label>
                <input 
                  type="date" 
                  required
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE COLABORADOR EXISTENTE */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Colaborador #{editFormData.id}</h3>
              <button className="modal-close-btn" onClick={() => { setIsEditModalOpen(false); setErrorMessage(''); }}>
                <X size={20} />
              </button>
            </div>
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.9rem'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            <form onSubmit={handleEditEmployee} className="modal-form">
              <div className="modal-field">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Matrícula / Código *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.registration_number}
                  onChange={(e) => setEditFormData({ ...editFormData, registration_number: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Departamento *</label>
                <select
                  required
                  value={editFormData.department_id}
                  onChange={(e) => setEditFormData({ ...editFormData, department_id: e.target.value, position_id: '' })}
                >
                  <option value="">Selecione o departamento...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Cargo *</label>
                <select
                  required
                  value={editFormData.position_id}
                  onChange={(e) => handleEditPositionChange(e.target.value)}
                >
                  <option value="">Selecione o cargo...</option>
                  {filteredPositionsForEditModal.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.title} ({pos.level})</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Salário Atual (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={editFormData.current_salary}
                  onChange={(e) => setEditFormData({ ...editFormData, current_salary: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  💡 Atualizar o salário recalculará instantaneamente o Compa-Ratio e a posição de mercado do colaborador.
                </span>
              </div>

              <div className="modal-field">
                <label>Data de Admissão *</label>
                <input 
                  type="date" 
                  required
                  value={editFormData.hire_date}
                  onChange={(e) => setEditFormData({ ...editFormData, hire_date: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Status Contratual *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo (Desligado)</option>
                  <option value="ON_LEAVE">Em Licença (Afastado)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
