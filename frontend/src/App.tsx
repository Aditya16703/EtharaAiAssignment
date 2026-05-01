import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useMe } from './hooks/queries';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/WorkspacePage';
import { AppLayout } from './layouts/AppLayout';

function AppBootstrap() {
  const { user, accessToken, setAuth, clearAuth, isHydrated } = useAuthStore();
  const navigate = useNavigate();
  const { data: meData, isLoading, isError } = useMe();

  // Sync TanStack Query user data into Zustand store
  useEffect(() => {
    if (meData && accessToken) {
      setAuth(meData, accessToken);
    }
  }, [meData, accessToken, setAuth]);

  // Handle auth expiry events from the Axios interceptor
  useEffect(() => {
    const handler = () => {
      clearAuth();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [clearAuth, navigate]);

  // Wait for Zustand to rehydrate from localStorage
  if (!isHydrated) return <Spinner />;

  // If we have a token but /me is still loading
  if (accessToken && isLoading) return <Spinner />;

  const isAuthenticated = !!(accessToken && (user || meData));

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/app/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Register />} />

      <Route path="/app" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path=":slug" element={<WorkspacePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '28px', height: '28px',
        border: '2px solid var(--border-color)',
        borderTopColor: 'var(--brand-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading...</span>
    </div>
  );
}

export default function App() {
  return <AppBootstrap />;
}
