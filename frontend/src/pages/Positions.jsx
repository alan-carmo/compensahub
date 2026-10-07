// Importação das bibliotecas do React para gerenciamento de estados e efeitos
import React, { useEffect, useState } from 'react';
// Importação da instância do Axios configurada para comunicar com a API FastAPI
import api from '../api/axios';
// Importação dos ícones do Lucide React para a interface de Cargos
import { BarChart3, Plus, Search, X, Pencil, Trash2, History, Clock } from 'lucide-react';
// Reutilização dos estilos CSS em módulo da página de departamentos
import styles from './Departments.module.css';

// Mapeamento dos níveis hierárquicos aceitos pelo backend com rótulos amigáveis
const LEVEL_OPTIONS = [
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno (Mid)' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'COORDINATOR', label: 'Coordenador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'DIRECTOR', label: 'Diretor' }
];

// Componente Funcional Principal: Tela de Gestão de Cargos e Faixas Salariais
const Positions = () => {
  // Lista de cargos cadastrados
  const [positions, setPositions] = useState([]);
  // Lista de departamentos cadastrados (usado na seleção do formulário)
  const [departments, setDepartments] = useState([]);
  // Mapeamento das faixas salariais por ID do cargo: { [position_id]: [lista_de_faixas] }
  const [salaryBands, setSalaryBands] = useState({});
  // Estado para armazenar o filtro da barra de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de visibilidade do modal de Criação de Cargo
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Controle de visibilidade do modal de Edição de Cargo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Controle de visibilidade do modal de Histórico de Faixas Salariais
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Dados armazenados do formulário (Criação/Edição)
  const [formData, setFormData] = useState({
    id: null,
    department_id: '',
    title: '',
    level: 'JUNIOR',
    target_salary: ''
  });
  
  // Cargo selecionado para exibição da modal de histórico de faixas salariais
  const [selectedPositionForHistory, setSelectedPositionForHistory] = useState(null);
  // Estado para bloquear botões durante chamadas assíncronas
  const [loading, setLoading] = useState(false);
  // Estado para exibir mensagens de erro amigáveis
  const [errorMessage, setErrorMessage] = useState('');

  // Busca a lista de departamentos para os selects do formulário
  const fetchDepartments = () => {
    api.get('/departments/').then(res => setDepartments(res.data)).catch(console.error);
  };

  // Busca todos os cargos e em seguida consulta as faixas salariais de cada cargo em paralelo
  const fetchPositionsAndBands = async () => {
    try {
      // 1. Busca todos os cargos cadastrados
      const posRes = await api.get('/positions/');
      const posList = posRes.data;
      setPositions(posList);

      // 2. Para cada cargo retornado, dispara a busca do histórico de faixas salariais
      const bandsMap = {};
      await Promise.all(
        posList.map(async (pos) => {
          try {
            const bRes = await api.get(`/salary-bands/position/${pos.id}`);
            bandsMap[pos.id] = bRes.data;
          } catch (e) {
            bandsMap[pos.id] = [];
          }
        })
      );
      // Atualiza o estado do mapa de faixas salariais
      setSalaryBands(bandsMap);
    } catch (err) {
      console.error("Erro ao carregar cargos e faixas:", err);
    }
  };

  // Carrega os dados na inicialização do componente
  useEffect(() => {
    fetchDepartments();
    fetchPositionsAndBands();
  }, []);

  // Função para cadastrar um novo cargo e criar automaticamente sua primeira faixa salarial
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.department_id || !formData.target_salary) {
      setErrorMessage("Por favor, preencha o título do cargo, departamento e o valor salarial.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Cria o cargo na API
      const res = await api.post('/positions/', {
        department_id: Number(formData.department_id),
        title: formData.title,
        level: formData.level,
        is_active: true
      });

      // 2. Extrai o ID do cargo recém-criado
      const positionId = res.data.id;
      // 3. Calcula os limites da faixa salarial com base no Salário de Mercado informado (Mid)
      const midSalary = parseFloat(formData.target_salary);
      const minSalary = Math.round(midSalary * 0.8 * 100) / 100; // 80% do valor de mercado
      const maxSalary = Math.round(midSalary * 1.2 * 100) / 100; // 120% do valor de mercado

      // 4. Cria a primeira versão da faixa salarial com vigência atual (is_current = True)
      await api.post('/salary-bands/', {
        position_id: positionId,
        min_salary: minSalary,
        mid_salary: midSalary,
        max_salary: maxSalary,
        effective_from: new Date().toISOString().split('T')[0],
        is_current: true
      });

      // Reset do formulário e recarregamento da página
      setFormData({ id: null, department_id: '', title: '', level: 'JUNIOR', target_salary: '' });
      setIsCreateModalOpen(false);
      fetchPositionsAndBands();
    } catch (err) {
      console.error(err);
      handleError(err, "Erro ao cadastrar cargo.");
    } finally {
      setLoading(false);
    }
  };

  // Abre o modal de edição preenchendo os dados atuais do cargo e a faixa salarial vigente
  const handleOpenEdit = (pos) => {
    const bands = salaryBands[pos.id] || [];
    const currentBand = bands.find(b => b.is_current) || bands[0];
    
    setFormData({
      id: pos.id,
      department_id: pos.department_id,
      title: pos.title,
      level: pos.level,
      target_salary: currentBand ? currentBand.mid_salary : ''
    });
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  // Atualiza os dados do cargo e cria um novo registro de versão caso o valor salarial tenha mudado
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.department_id || !formData.target_salary) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Atualiza título, departamento e nível do cargo
      await api.put(`/positions/${formData.id}`, {
        department_id: Number(formData.department_id),
        title: formData.title,
        level: formData.level
      });

      // 2. Se o valor salarial foi alterado, cria uma nova versão vigente da faixa salarial
      const midSalary = parseFloat(formData.target_salary);
      const bands = salaryBands[formData.id] || [];
      const currentBand = bands.find(b => b.is_current);

      if (!currentBand || Number(currentBand.mid_salary) !== midSalary) {
        const minSalary = Math.round(midSalary * 0.8 * 100) / 100;
        const maxSalary = Math.round(midSalary * 1.2 * 100) / 100;

        // O backend desativa automaticamente a versão antiga e torna esta a versão vigente!
        await api.post('/salary-bands/', {
          position_id: formData.id,
          min_salary: minSalary,
          mid_salary: midSalary,
          max_salary: maxSalary,
          effective_from: new Date().toISOString().split('T')[0],
          is_current: true
        });
      }

      setIsEditModalOpen(false);
      fetchPositionsAndBands();
    } catch (err) {
      console.error(err);
      handleError(err, "Erro ao atualizar cargo.");
    } finally {
      setLoading(false);
    }
  };

  // Exclui um cargo do sistema após confirmação do usuário
  const handleDelete = async (pos) => {
    if (window.confirm(`Tem certeza que deseja excluir o cargo "${pos.title}"?`)) {
      try {
        await api.delete(`/positions/${pos.id}`);
        fetchPositionsAndBands();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir cargo. Verifique se existem colaboradores vinculados a ele.");
      }
    }
  };

  // Abre o modal de histórico de alterações de faixas salariais do cargo selecionado
  const handleOpenHistory = (pos) => {
    setSelectedPositionForHistory(pos);
    setIsHistoryModalOpen(true);
  };

  // Função auxiliar para formatação de erros da API
  const handleError = (err, defaultMsg) => {
    let msg = defaultMsg;
    if (err.message === "Network Error" || !err.response) {
      msg = "Conexão recusada (Network Error). Verifique se o servidor backend (FastAPI) está rodando na porta 8000.";
    } else if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg).join(', ');
      }
    }
    setErrorMessage(msg);
  };

  // Filtro de busca de cargos por título em tempo real
  const filtered = positions.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Cabeçalho da página de Cargos e Níveis */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <div className={styles.iconWrapper}><BarChart3 size={24} /></div>
          <div>
            <h2>Cargos e Níveis</h2>
            <p>Gerencie a estrutura de cargos, níveis de senioridade e faixas salariais</p>
          </div>
        </div>
        {/* Botão de criação de novo cargo */}
        <button className={styles.addButton} onClick={() => {
          setFormData({ id: null, department_id: '', title: '', level: 'JUNIOR', target_salary: '' });
          setErrorMessage('');
          setIsCreateModalOpen(true);
        }}>
          <Plus size={18} /> Novo Cargo
        </button>
      </div>

      {/* Card da Tabela de Cargos */}
      <div className={`${styles.tableCard} glass-panel`}>
        {/* Barra de Busca de Cargos */}
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por título do cargo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela com Colunas de Salários e Ações */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título do Cargo</th>
                <th>Nível</th>
                <th>Salário Mercado (Mid)</th>
                <th>Faixa Salarial (80% - 120%)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pos => {
                const bands = salaryBands[pos.id] || [];
                const currentBand = bands.find(b => b.is_current) || bands[0];

                return (
                  <tr key={pos.id}>
                    <td>#{pos.id}</td>
                    <td><strong>{pos.title}</strong></td>
                    <td>{pos.level}</td>
                    {/* Exibição do Salário Médio de Mercado (100%) */}
                    <td>
                      {currentBand ? (
                        <strong style={{ color: 'var(--primary)' }}>
                          R$ {Number(currentBand.mid_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    {/* Exibição da Faixa Mínima (80%) a Máxima (120%) */}
                    <td>
                      {currentBand ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          R$ {Number(currentBand.min_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ~ 
                          R$ {Number(currentBand.max_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Nenhuma faixa cadastrada</span>
                      )}
                    </td>
                    {/* Badge de Status do Cargo */}
                    <td>
                      <span className={`${styles.badge} ${pos.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                        {pos.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* Botões de Histórico, Edição e Exclusão */}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {/* Botão para Histórico de Faixas Salariais */}
                        <button 
                          title="Histórico de Alterações" 
                          onClick={() => handleOpenHistory(pos)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}
                        >
                          <History size={16} /> Histórico
                        </button>

                        {/* Botão de Edição */}
                        <button 
                          title="Editar Cargo" 
                          onClick={() => handleOpenEdit(pos)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--warning)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Botão de Exclusão */}
                        <button 
                          title="Excluir Cargo" 
                          onClick={() => handleDelete(pos)}
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
          {filtered.length === 0 && (
            <div className={styles.emptyState}>Nenhum cargo encontrado.</div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO DE CARGO */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Cargo</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
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
            <form onSubmit={handleCreateSubmit} className="modal-form">
              {/* Seleção do Departamento */}
              <div className="modal-field">
                <label>Departamento *</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Selecione o departamento...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Título do Cargo */}
              <div className="modal-field">
                <label>Título do Cargo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Desenvolvedor Full Stack" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Seleção de Nível */}
              <div className="modal-field">
                <label>Nível de Senioridade *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  {LEVEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Campo para Valor Salarial de Referência */}
              <div className="modal-field">
                <label>Valor Salarial / Mercado (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="Ex: 8500.00" 
                  value={formData.target_salary}
                  onChange={(e) => setFormData({ ...formData, target_salary: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Cadastrar Cargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CARGO */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Cargo #{formData.id}</h3>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
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
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-field">
                <label>Departamento *</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Selecione o departamento...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Título do Cargo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Nível de Senioridade *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  {LEVEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Valor Salarial / Mercado (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.target_salary}
                  onChange={(e) => setFormData({ ...formData, target_salary: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  💡 Alterar este valor registrará uma nova versão no histórico de faixas salariais.
                </span>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE ALTERAÇÕES E VERSIONAMENTO DE FAIXAS SALARIAIS */}
      {isHistoryModalOpen && selectedPositionForHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} color="var(--primary)" />
                <div>
                  <h3>Histórico de Alterações</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Cargo: <strong>{selectedPositionForHistory.title} ({selectedPositionForHistory.level})</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {(salaryBands[selectedPositionForHistory.id] || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Nenhuma alteração ou faixa salarial registrada para este cargo.
                </div>
              ) : (
                (salaryBands[selectedPositionForHistory.id] || [])
                  .slice()
                  .sort((a, b) => b.id - a.id) // Ordena da versão mais recente para a mais antiga
                  .map((band) => (
                    <div 
                      key={band.id} 
                      style={{
                        background: band.is_current ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                        border: band.is_current ? '1px solid var(--primary)' : '1px solid var(--panel-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: band.is_current ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}>
                          {band.is_current ? 'Vigente (Atual)' : `Versão #${band.id}`}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Vigência a partir de: <strong>{band.effective_from}</strong>
                        </span>
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                        Salário Mercado (Mid): R$ {Number(band.mid_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Faixa Salarial: R$ {Number(band.min_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Mín) ~ R$ {Number(band.max_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Máx)
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="modal-btn-cancel" onClick={() => setIsHistoryModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Positions;
