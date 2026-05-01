import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/WorkspacePage';
import { AppLayout } from './layouts/AppLayout';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--brand-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading...</span>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/app/dashboard' : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app/dashboard" replace /> : <Register />} />

      <Route path="/app" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path=":slug" element={<WorkspacePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
