import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

console.log('[API] baseURL =', BASE_URL); 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      console.error('[API] Network error — backend unreachable:', err.message);
      console.error('[API] Tried to reach:', err.config?.baseURL + err.config?.url);
      err.message = 'Cannot reach server. Check your internet or the backend may be starting up (Render free tier takes ~30s).';
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }

    return Promise.reject(err);
  }
);

export default api;
