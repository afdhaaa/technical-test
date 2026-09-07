import axios from 'axios';

const metaEnv = (import.meta as any).env || {};
export const API_BASE_URL = metaEnv.VITE_API_URL || (metaEnv.DEV ? 'http://127.0.0.1:3000' : '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dexa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to get full image URL
export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};
