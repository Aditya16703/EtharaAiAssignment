import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// ── Request interceptor: attach token ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.group(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) console.log('↑ payload:', config.data);
    console.groupEnd();
  }

  return config;
});

// ── Response interceptor: handle 401 + refresh ────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.group(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} [${response.status}]`);
      console.log('↓ data:', response.data);
      console.groupEnd();
    }
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.group(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} [${error.response?.status}]`);
      console.error('error:', error.response?.data ?? error.message);
      console.groupEnd();
    }

    const originalRequest = error.config;

    // Auto-refresh on 401 (but not the refresh endpoint itself)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        console.log('🔄 Refreshing token...');
        const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        const { accessToken, user } = res.data.data;
        useAuthStore.getState().setAuth(user, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        console.warn('🔒 Refresh failed — clearing session');
        useAuthStore.getState().clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
