// Importação dos hooks do React (Estado, Efeitos)
import React, { useEffect, useState } from 'react';
// Importação da instância pré-configurada do Axios para requisições HTTP
import api from '../api/axios';
// Importação dos ícones do Lucide React
import { Settings as SettingsIcon, Building, Sliders, Save, CheckCircle2 } from 'lucide-react';
// Importação dos estilos via CSS Modules
import styles from './Settings.module.css';

// Componente Funcional Principal: Tela de Configurações Gerais do Sistema
const Settings = () => {
  // Estado para os campos de formulário das configurações
  const [formData, setFormData] = useState({
    company_name: '',
    cnpj: '',
    currency: 'BRL',
    default_raise_percent: 5.0,
    compa_ratio_eligibility_threshold: 95.0,
    payroll_budget_cap: 500000.0
  });

  // Estado para armazenar o valor atual da folha somada dos funcionários
  const [currentPayroll, setCurrentPayroll] = useState(0);
  // Estado de carregamento da requisição
  const [loading, setLoading] = useState(false);
  // Estado de mensagem de sucesso ao salvar
  const [successMessage, setSuccessMessage] = useState('');
  // Estado de mensagem de erro
  const [errorMessage, setErrorMessage] = useState('');

  // Busca as configurações vigentes e o total da folha salarial na API
  const fetchSettingsAndPayroll = () => {
    setLoading(true);
    Promise.all([
      api.get('/settings'),
      api.get('/employees')
    ])
      .then(([settingsRes, empRes]) => {
        setFormData(settingsRes.data);
        const total = empRes.data.reduce((acc, emp) => acc + (parseFloat(emp.current_salary) || 0), 0);
        setCurrentPayroll(total);
      })
      .catch(err => {
        console.error("Erro ao buscar configurações:", err);
        setErrorMessage("Não foi possível carregar as configurações do servidor.");
      })
      .finally(() => setLoading(false));
  };

  // Executa o carregamento inicial dos dados ao abrir a tela
  useEffect(() => {
    fetchSettingsAndPayroll();
  }, []);

  // Handler para salvar as alterações do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.put('/settings', {
        company_name: formData.company_name,
        cnpj: formData.cnpj,
        currency: formData.currency,
        default_raise_percent: parseFloat(formData.default_raise_percent),
        compa_ratio_eligibility_threshold: parseFloat(formData.compa_ratio_eligibility_threshold),
        payroll_budget_cap: parseFloat(formData.payroll_budget_cap)
      });

      setFormData(res.data);
      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao salvar as configurações no servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Calcula o percentual de comprometimento da folha em relação ao teto cadastrado
  const budgetUsagePercent = formData.payroll_budget_cap > 0 
    ? ((currentPayroll / formData.payroll_budget_cap) * 100).toFixed(1)
    : 0;

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Página de Configurações */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <div className={styles.iconWrapper}><SettingsIcon size={24} /></div>
          <div>
            <h2>Configurações do Sistema</h2>
            <p>Gerencie parâmetros da empresa, regras de reajuste e teto orçamentário da folha</p>
          </div>
        </div>
      </div>

      {/* Banner de Erro */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Banner de Sucesso */}
      {successMessage && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid}>
          {/* CARD 1: DADOS DA EMPRESA */}
          <div className={`${styles.card} glass-panel`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><Building size={20} /></div>
              <h3>Parâmetros Cadastrais da Empresa</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Nome da Empresa / Razão Social *</label>
              <input 
                type="text" 
                required
                className={styles.input}
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
              <span className={styles.hint}>Exibido nos relatórios em PDF e documentos emitidos pelo CompensaHub.</span>
            </div>

            <div className={styles.formGroup}>
              <label>CNPJ *</label>
              <input 
                type="text" 
                required
                className={styles.input}
                placeholder="12.345.678/0001-90"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Moeda Padrão *</label>
              <select 
                className={styles.input}
                value={formData.currency || 'BRL'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="BRL">BRL (R$) - Real Brasileiro</option>
                <option value="USD">USD ($) - Dólar Americano</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>
          </div>

          {/* CARD 2: REGRAS DE REAJUSTE E TETO ORÇAMENTÁRIO */}
          <div className={`${styles.card} glass-panel`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><Sliders size={20} /></div>
              <h3>Regras de Reajuste & Teto Orçamentário</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Percentual Padrão de Reajuste Salarial (%) *</label>
              <input 
                type="number" 
                step="0.1"
                min="0" max="100"
                required
                className={styles.input}
                value={formData.default_raise_percent || 0}
                onChange={(e) => setFormData({ ...formData, default_raise_percent: e.target.value })}
              />
              <span className={styles.hint}>Sugestão inicial pré-carregada no Simulador de Impacto Financeiro.</span>
            </div>

            <div className={styles.formGroup}>
              <label>Teto Limite de Compa-Ratio para Elegibilidade (%) *</label>
              <input 
                type="number" 
                step="0.1"
                min="50" max="150"
                required
                className={styles.input}
                value={formData.compa_ratio_eligibility_threshold || 95}
                onChange={(e) => setFormData({ ...formData, compa_ratio_eligibility_threshold: e.target.value })}
              />
              <span className={styles.hint}>Colaboradores abaixo deste limite são considerados elegíveis para aumento de mérito.</span>
            </div>

            <div className={styles.formGroup}>
              <label>Teto Orçamentário Mensal da Folha (R$) *</label>
              <input 
                type="number" 
                step="0.01"
                required
                className={styles.input}
                value={formData.payroll_budget_cap || 0}
                onChange={(e) => setFormData({ ...formData, payroll_budget_cap: e.target.value })}
              />
              <span className={styles.hint}>Limite fiscal máximo para alertas de estouro orçamentário.</span>
            </div>

            {/* Painel Comparativo de Orçamento */}
            <div className={styles.budgetCard}>
              <div className={styles.budgetText}>
                <span>Folha Atual vs Teto ({budgetUsagePercent}%)</span>
                <strong style={{ color: Number(budgetUsagePercent) > 100 ? 'var(--danger)' : 'var(--success)' }}>
                  R$ {currentPayroll.toLocaleString('pt-BR', {minimumFractionDigits: 2})} / R$ {(parseFloat(formData.payroll_budget_cap) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES PARA SALVAR */}
        <div className={`${styles.saveBar} glass-panel`} style={{ marginTop: '24px' }}>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Exporta o componente Settings como padrão
export default Settings;
