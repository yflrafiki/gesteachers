import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const defaultApiUrl = import.meta.env.PROD ? 'https://ges-backend-mhro.onrender.com' : '';
export const API_URL = rawApiUrl || defaultApiUrl;

if (!rawApiUrl && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not set. Falling back to default production API URL.');
}

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;