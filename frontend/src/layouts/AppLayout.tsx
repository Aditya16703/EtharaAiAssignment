import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import api from '../api/client';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateWorkspaceModal({ isOpen, onClose, onCreated }: WorkspaceModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/workspaces', { name, slug });
      onCreated();
      onClose();
      navigate(`/app/${res.data.data.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Workspace Name" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="My Team" required />
        <Input label="Workspace Slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-team" required />
        {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Workspace'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AppLayout() {
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onCreateWorkspace={() => setWsModalOpen(true)} refreshKey={refreshKey} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <CreateWorkspaceModal
        isOpen={wsModalOpen}
        onClose={() => setWsModalOpen(false)}
        onCreated={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
