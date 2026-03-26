import axios from 'axios';
import { API_ROUTES } from '../config/apiRoutes';
import { getActiveRole, getToken } from './authStorage';

// Configurar instancia de axios
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

// Interceptor para añadir token
instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const activeRole = getActiveRole();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeRole) {
      config.headers['X-Active-Role'] = activeRole;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
