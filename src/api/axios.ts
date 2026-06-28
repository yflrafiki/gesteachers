import axios from 'axios';
import toast from 'react-hot-toast';

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
      // Only a session that was actually logged in can "expire" — a failed
      // login attempt (no token yet) is handled by the login page itself, so
      // showing this toast there too would be a confusing double message.
      const hadSession = Boolean(sessionStorage.getItem('token'));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (hadSession) {
        toast.error('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (!error.response) {
      toast.error('Could not reach the server. Check your connection and try again.');
    }
    return Promise.reject(error);
  }
);

export default API;