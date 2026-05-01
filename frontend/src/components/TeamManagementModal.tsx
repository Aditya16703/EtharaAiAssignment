import React, { useState } from 'react';
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '../hooks/queries';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TeamManagementModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamManagementModal({ slug, isOpen, onClose }: TeamManagementModalProps) {
  const { user: currentUser } = useAuthStore();
  const { data: members = [], isLoading } = useMembers(slug);
  const inviteMember = useInviteMember(slug);
  const updateRole = useUpdateMemberRole(slug);
  const removeMember = useRemoveMember(slug);

  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');

  // Find current user's role in this workspace
  const currentUserMember = members.find((m: any) => m.userId === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'ADMIN';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await inviteMember.mutateAsync(inviteEmail);
      setInviteEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateRole.mutateAsync({ userId, role });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember.mutateAsync(userId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '400px' }}>
        
        {isAdmin && (
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="Invite by Email" 
                placeholder="colleague@company.com" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviteMember.isPending} style={{ height: '38px' }}>
              <UserPlus size={16} style={{ marginRight: '6px' }} />
              Invite
            </Button>
          </form>
        )}

        {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}

        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Members ({members.length})
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
            ) : members.map((m: any) => (
              <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                  {m.user.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.user.name}
                    {m.userId === currentUser?.id && <span style={{ fontSize: '10px', color: 'var(--brand-primary)', fontWeight: 600 }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user.email}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAdmin && m.userId !== currentUser?.id ? (
                    <>
                      <select 
                        value={m.role} 
                        onChange={e => handleRoleChange(m.userId, e.target.value)}
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '12px', padding: '2px 4px' }}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      <button 
                        onClick={() => handleRemove(m.userId)}
                        style={{ color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {m.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                      {m.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
