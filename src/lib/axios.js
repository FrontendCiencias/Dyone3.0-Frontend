import axios from 'axios';
import { API_ROUTES } from '../config/apiRoutes';
import { getToken } from './authStorage';

// Configurar instancia de axios
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

// Interceptor para añadir token
instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;