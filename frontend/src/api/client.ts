import axios from 'axios';

// Get token from localStorage if any
const getAccessToken = () => localStorage.getItem('accessToken');
export const setAccessToken = (token: string | null) => {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Headers:', config.headers);
  if (config.data) console.log('Payload:', config.data);
  console.groupEnd();
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  async (error) => {
    console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error config:', error.message);
    }
    console.groupEnd();

    // Auto-refresh logic
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        console.log('🔄 Attempting token refresh...');
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed. User logged out.');
        setAccessToken(null);
        // Dispatch custom event to trigger UI redirect/reset
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
