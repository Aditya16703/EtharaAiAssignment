import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useCreateWorkspace } from '../hooks/queries';

function CreateWorkspaceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const createWorkspace = useCreateWorkspace();

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const ws = await createWorkspace.mutateAsync({ name, slug });
      setName(''); setSlug('');
      onClose();
      navigate(`/app/${ws.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Workspace">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Workspace Name" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Acme Corp" required />
        <Input label="URL Slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="acme-corp" required />
        {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createWorkspace.isPending}>
            {createWorkspace.isPending ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AppLayout() {
  const [wsModalOpen, setWsModalOpen] = useState(false);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onCreateWorkspace={() => setWsModalOpen(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <CreateWorkspaceModal isOpen={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </div>
  );
}
