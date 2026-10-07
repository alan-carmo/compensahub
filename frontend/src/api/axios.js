// Importação da biblioteca Axios para realizar requisições HTTP
import axios from 'axios';

// Criação da instância centralizada do Axios apontando para a API FastAPI
const api = axios.create({
  // URL base de todos os endpoints RESTful v1 da aplicação
  baseURL: 'http://localhost:8000/api/v1',
  // Cabeçalhos padrão configurados para tráfego em formato JSON
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisições para injetar o Token JWT salvo no localStorage automaticamente em cada chamada
api.interceptors.request.use(
  (config) => {
    // Lê o token JWT armazenado no navegador
    const token = localStorage.getItem('token');
    // Se o token existir, injeta no cabeçalho Authorization Bearer
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Em caso de erro na requisição, rejeita a promessa
    return Promise.reject(error);
  }
);

// Exportação da instância para ser utilizada em qualquer tela ou componente React
export default api;
