import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface SidebarProps {
  onCreateWorkspace: () => void;
  refreshKey?: number;
}

export function Sidebar({ onCreateWorkspace, refreshKey }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get('/workspaces');
        setWorkspaces(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkspaces();
  }, [refreshKey]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* User Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '28px', height: '28px',
          backgroundColor: 'var(--brand-primary)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        <div style={{ marginBottom: '4px' }}>
          <SidebarLink to="/app/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" />
        </div>

        {/* Workspaces Section */}
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Workspaces
            </span>
            <button
              onClick={onCreateWorkspace}
              title="Create Workspace"
              style={{ color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: '2px', borderRadius: '3px' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Plus size={13} />
            </button>
          </div>

          {workspaces.length === 0 && (
            <button
              onClick={onCreateWorkspace}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 8px',
                fontSize: '13px', color: 'var(--text-tertiary)',
                cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)',
                backgroundColor: 'transparent',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              + New workspace
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {workspaces.map(ws => (
              <WorkspaceLink key={ws.id} ws={ws} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 8px', width: '100%',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', fontSize: '13px',
            cursor: 'pointer', textAlign: 'left',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

function WorkspaceLink({ ws }: { ws: any }) {
  const color = stringToColor(ws.name);
  return (
    <NavLink
      to={`/app/${ws.slug}`}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
        fontSize: '13px', fontWeight: 500,
        textDecoration: 'none', transition: 'all 0.1s ease',
      })}
      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseOut={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div style={{
        width: '18px', height: '18px',
        backgroundColor: color,
        borderRadius: '4px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 700, color: '#fff'
      }}>
        {ws.name[0].toUpperCase()}
      </div>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {ws.name}
      </span>
    </NavLink>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
        fontSize: '13px', fontWeight: 500,
        textDecoration: 'none', transition: 'all 0.1s ease',
      })}
      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseOut={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {icon}
      {label}
    </NavLink>
  );
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#5e6ad2', '#26a69a', '#e67e22', '#8e44ad', '#2980b9', '#c0392b'];
  return colors[Math.abs(hash) % colors.length];
}
