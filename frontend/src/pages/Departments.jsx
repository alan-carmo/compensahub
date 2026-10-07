// Importação do React e Hooks para controle de estado e ciclo de vida do componente
import React, { useEffect, useState } from 'react';
// Importação da instância base do Axios configurada com a URL do Backend FastAPI
import api from '../api/axios';
// Importação de ícones vetoriais modernos da biblioteca Lucide React
import { Briefcase, Plus, Search, X, Pencil, Trash2, History, Clock } from 'lucide-react';
// Importação do arquivo de estilos em CSS Modules exclusivo para a tela de Departamentos
import styles from './Departments.module.css';

// Componente Funcional Principal: Tela de Gestão de Departamentos
const Departments = () => {
  // Estado para armazenar a lista de departamentos retornada pelo backend
  const [departments, setDepartments] = useState([]);
  // Estado para armazenar os cargos (usado no cálculo de cargos por departamento)
  const [positions, setPositions] = useState([]);
  // Estado para armazenar os colaboradores (usado no cálculo de funcionários alocados)
  const [employees, setEmployees] = useState([]);
  // Estado para o termo digitado na barra de pesquisa/busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de visibilidade do modal de Criação de Novo Departamento
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Controle de visibilidade do modal de Edição de Departamento
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Controle de visibilidade do modal de Histórico e Métricas do Departamento
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Estado que armazena os dados digitados no formulário de criação/edição
  const [formData, setFormData] = useState({ id: null, name: '', cost_center: '', is_active: true });
  // Estado que guarda o departamento selecionado para exibição do modal de histórico
  const [selectedDeptForHistory, setSelectedDeptForHistory] = useState(null);
  
  // Estado para indicar se uma requisição HTTP está em andamento (desabilita botões)
  const [loading, setLoading] = useState(false);
  // Estado para armazenar mensagens de erro caso a requisição falhe
  const [errorMessage, setErrorMessage] = useState('');

  // Função assíncrona que carrega simultaneamente departamentos, cargos e funcionários do backend
  const fetchAllData = async () => {
    try {
      // Dispara 3 requisições GET em paralelo usando Promise.all para máxima performance
      const [deptRes, posRes, empRes] = await Promise.all([
        api.get('/departments/'),
        api.get('/positions/'),
        api.get('/employees')
      ]);
      // Atualiza os estados do React com os dados devolvidos pelas APIs
      setDepartments(deptRes.data);
      setPositions(posRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados dos departamentos:", err);
    }
  };

  // Hook de efeito que executa a busca de dados assim que a página é carregada
  useEffect(() => {
    fetchAllData();
  }, []);

  // Função chamada ao enviar o formulário de CRIAÇÃO de um novo departamento
  const handleCreateSubmit = async (e) => {
    // Impede o recarregamento automático da página ao submeter o formulário
    e.preventDefault();
    // Validação básica: garante que o nome do departamento foi informado
    if (!formData.name) return;
    
    setLoading(true); // Ativa indicador de carregamento
    setErrorMessage(''); // Limpa mensagens de erro anteriores
    
    try {
      // Requisição POST enviando o nome e centro de custo para o backend FastAPI
      await api.post('/departments/', {
        name: formData.name,
        cost_center: formData.cost_center || null,
        is_active: true
      });
      // Reseta o formulário
      setFormData({ id: null, name: '', cost_center: '', is_active: true });
      // Fecha o modal de criação
      setIsCreateModalOpen(false);
      // Recarrega os departamentos atualizados do banco de dados
      fetchAllData();
    } catch (err) {
      console.error(err);
      // Trata e exibe mensagens de erro amigáveis
      handleError(err, "Erro ao cadastrar departamento.");
    } finally {
      setLoading(false); // Desativa indicador de carregamento
    }
  };

  // Função para abrir o modal de EDIÇÃO pré-preenchido com os dados do departamento selecionado
  const handleOpenEdit = (dept) => {
    setFormData({
      id: dept.id,
      name: dept.name,
      cost_center: dept.cost_center || '',
      is_active: dept.is_active
    });
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  // Função chamada ao enviar o formulário de EDIÇÃO de um departamento
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      // Requisição PUT atualizando o departamento específico via ID
      await api.put(`/departments/${formData.id}`, {
        name: formData.name,
        cost_center: formData.cost_center || null,
        is_active: formData.is_active
      });
      // Fecha o modal de edição
      setIsEditModalOpen(false);
      // Recarrega a tabela com os dados atualizados
      fetchAllData();
    } catch (err) {
      console.error(err);
      handleError(err, "Erro ao atualizar departamento.");
    } finally {
      setLoading(false);
    }
  };

  // Função para EXCLUIR um departamento do sistema
  const handleDelete = async (dept) => {
    // Exibe diálogo de confirmação ao usuário
    if (window.confirm(`Tem certeza que deseja excluir o departamento "${dept.name}"?`)) {
      try {
        // Requisição DELETE para a API
        await api.delete(`/departments/${dept.id}`);
        // Atualiza a tabela
        fetchAllData();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir departamento. Verifique se existem cargos ou colaboradores vinculados a ele.");
      }
    }
  };

  // Função para abrir o modal de HISTÓRICO e métricas de um departamento
  const handleOpenHistory = (dept) => {
    setSelectedDeptForHistory(dept);
    setIsHistoryModalOpen(true);
  };

  // Função utilitária para capturar e formatar erros de rede / validação da API
  const handleError = (err, defaultMsg) => {
    let msg = defaultMsg;
    // Se o backend estiver fora do ar ou recusar a conexão
    if (err.message === "Network Error" || !err.response) {
      msg = "Conexão recusada (Network Error). Verifique se o servidor backend (FastAPI) está rodando na porta 8000.";
    } else if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === 'string') {
        // Tradução de mensagens de chave duplicada
        if (detail.includes("already registered") || detail.includes("already exists")) {
          msg = "Já existe um departamento cadastrado com este nome.";
        } else {
          msg = detail;
        }
      } else if (Array.isArray(detail)) {
        // Concatena mensagens de erro de validação do Pydantic
        msg = detail.map(d => d.msg).join(', ');
      }
    }
    setErrorMessage(msg);
  };

  // Filtra os departamentos em tempo real com base no texto digitado na pesquisa
  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.cost_center && d.cost_center.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    // Container principal com animação de entrada em CSS
    <div className={styles.container}>
      
      {/* CABEÇALHO DA TELA DE DEPARTAMENTOS */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          {/* Ícone estilizado do departamento */}
          <div className={styles.iconWrapper}><Briefcase size={24} /></div>
          <div>
            <h2>Departamentos</h2>
            <p>Gerencie os centros de custo e áreas da empresa</p>
          </div>
        </div>
        {/* Botão para abrir o modal de cadastro de novo departamento */}
        <button className={styles.addButton} onClick={() => {
          setFormData({ id: null, name: '', cost_center: '', is_active: true });
          setErrorMessage('');
          setIsCreateModalOpen(true);
        }}>
          <Plus size={18} /> Novo Departamento
        </button>
      </div>

      {/* PAINEL EM GLASSMORPHISM DA TABELA DE DEPARTAMENTOS */}
      <div className={`${styles.tableCard} glass-panel`}>
        {/* Barra de Ferramentas com Campo de Busca */}
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou centro de custo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Listagem de Departamentos */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Departamento</th>
                <th>Centro de Custo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeamento de cada departamento filtrado em uma linha da tabela */}
              {filtered.map(dept => (
                <tr key={dept.id}>
                  {/* Coluna ID */}
                  <td>#{dept.id}</td>
                  {/* Coluna Nome do Departamento */}
                  <td><strong>{dept.name}</strong></td>
                  {/* Coluna Centro de Custo */}
                  <td>{dept.cost_center || '-'}</td>
                  {/* Coluna Status (Ativo / Inativo com badge colorida) */}
                  <td>
                    <span className={`${styles.badge} ${dept.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {dept.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {/* Coluna Ações com Botões de Histórico, Edição e Exclusão */}
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {/* Botão para visualizar Histórico e Métricas */}
                      <button 
                        title="Histórico de Registro" 
                        onClick={() => handleOpenHistory(dept)}
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

                      {/* Botão para Editar Departamento */}
                      <button 
                        title="Editar Departamento" 
                        onClick={() => handleOpenEdit(dept)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--warning)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      {/* Botão para Excluir Departamento */}
                      <button 
                        title="Excluir Departamento" 
                        onClick={() => handleDelete(dept)}
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
              ))}
            </tbody>
          </table>
          {/* Estado exibido caso nenhum departamento seja encontrado */}
          {filtered.length === 0 && (
            <div className={styles.emptyState}>Nenhum departamento encontrado.</div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO DE NOVO DEPARTAMENTO */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Departamento</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {/* Banner exibido quando ocorre um erro na requisição */}
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
              {/* Campo para o Nome do Departamento */}
              <div className="modal-field">
                <label>Nome do Departamento *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Engenharia de Software" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Campo para o Centro de Custo */}
              <div className="modal-field">
                <label>Centro de Custo</label>
                <input 
                  type="text" 
                  placeholder="Ex: CC-4001" 
                  value={formData.cost_center}
                  onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                />
              </div>

              {/* Botões de Ação do Modal */}
              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE DEPARTAMENTO EXISTENTE */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Departamento #{formData.id}</h3>
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
              {/* Campo para alteração do Nome do Departamento */}
              <div className="modal-field">
                <label>Nome do Departamento *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Campo para alteração do Centro de Custo */}
              <div className="modal-field">
                <label>Centro de Custo</label>
                <input 
                  type="text" 
                  value={formData.cost_center}
                  onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                />
              </div>

              {/* Dropdown para alteração do Status (Ativo / Inativo) */}
              <div className="modal-field">
                <label>Status</label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              {/* Botões de Ação do Modal de Edição */}
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

      {/* MODAL DE HISTÓRICO E MÉTRICAS DO DEPARTAMENTO */}
      {isHistoryModalOpen && selectedDeptForHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} color="var(--primary)" />
                <div>
                  <h3>Histórico &amp; Métricas do Departamento</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Departamento: <strong>{selectedDeptForHistory.name}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {/* Grid de Informações Cadastrais e Registro do Departamento */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--panel-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID do Departamento:</span>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>#{selectedDeptForHistory.id}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Centro de Custo:</span>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>{selectedDeptForHistory.cost_center || 'Não informado'}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Atual:</span>
                  <div>
                    <span className={`${styles.badge} ${selectedDeptForHistory.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {selectedDeptForHistory.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data de Cadastro:</span>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                    {selectedDeptForHistory.created_at ? new Date(selectedDeptForHistory.created_at).toLocaleDateString('pt-BR') : 'Data inicial'}
                  </div>
                </div>
              </div>

              {/* Card de Métricas de Cargos e Funcionários Alocados */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>📊 Estrutura Alocada:</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  • <strong>{positions.filter(p => p.department_id === selectedDeptForHistory.id).length}</strong> Cargo(s) cadastrado(s) nesta área.
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  • <strong>{employees.filter(e => e.department_id === selectedDeptForHistory.id).length}</strong> Colaborador(es) alocado(s) atualmente.
                </div>
              </div>
            </div>

            {/* Ação de Fechamento do Modal */}
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

// Exportação do componente Departments para uso nas rotas do React Router
export default Departments;
