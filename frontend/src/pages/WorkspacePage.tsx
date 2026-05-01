import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, MoreHorizontal, Users } from 'lucide-react';
import api from '../api/client';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const STATUSES = [
  { key: 'BACKLOG', label: 'Backlog', color: '#71717a' },
  { key: 'TODO', label: 'Todo', color: '#a1a1aa' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
  { key: 'IN_REVIEW', label: 'In Review', color: '#5e6ad2' },
  { key: 'DONE', label: 'Done', color: '#22c55e' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#ef4444' },
];

const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#a1a1aa', LOW: '#71717a', NO_PRIORITY: '#3f3f46',
};

function PriorityDot({ priority }: { priority: string }) {
  return <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIORITY_COLORS[priority] || '#3f3f46', display: 'inline-block', flexShrink: 0 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find(x => x.key === status);
  return (
    <span style={{
      fontSize: '11px', fontWeight: 500, padding: '2px 8px',
      borderRadius: '20px', border: `1px solid ${s?.color}30`,
      color: s?.color, backgroundColor: `${s?.color}15`,
    }}>
      {s?.label || status}
    </span>
  );
}

function IssueRow({ issue, slug, members, onUpdated }: { issue: any; slug: string; members: any[]; onUpdated: () => void }) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/workspaces/${slug}/issues/${issue.id}/status`, { status: newStatus });
      onUpdated();
    } catch (err: any) {
      console.error('Status update failed:', err.response?.data || err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 20px',
      borderBottom: '1px solid var(--border-color)',
      transition: 'background 0.1s',
    }}
      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <PriorityDot priority={issue.priority} />
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace', flexShrink: 0 }}>{issue.identifier}</span>
      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>

      <select
        value={issue.status}
        onChange={e => updateStatus(e.target.value)}
        disabled={updating}
        style={{
          backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)',
          fontSize: '12px', cursor: 'pointer', outline: 'none',
        }}
      >
        {STATUSES.map(s => <option key={s.key} value={s.key} style={{ backgroundColor: 'var(--bg-panel)' }}>{s.label}</option>)}
      </select>

      <StatusBadge status={issue.status} />

      {issue.assignee ? (
        <div title={issue.assignee.name} style={{
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: 'var(--brand-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {issue.assignee.name[0].toUpperCase()}
        </div>
      ) : (
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px dashed var(--border-color)', flexShrink: 0 }} />
      )}

      {issue.dueDate && (
        <span style={{
          fontSize: '12px', flexShrink: 0,
          color: new Date(issue.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-tertiary)',
        }}>
          {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}

function CreateIssueModal({ slug, members, isOpen, onClose, onCreated }: any) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/workspaces/${slug}/issues`, {
        title,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      setTitle(''); setPriority('MEDIUM'); setAssigneeId(''); setDueDate('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Issue">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title..." required />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: '14px' }}>
              {PRIORITIES.map(p => <option key={p} value={p} style={{ backgroundColor: 'var(--bg-panel)' }}>{p.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Assignee</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: '14px' }}>
              <option value="" style={{ backgroundColor: 'var(--bg-panel)' }}>Unassigned</option>
              {members.map((m: any) => <option key={m.userId} value={m.userId} style={{ backgroundColor: 'var(--bg-panel)' }}>{m.user.name}</option>)}
            </select>
          </div>
        </div>
        <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Issue'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [workspace, setWorkspace] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const [wsRes, issuesRes, membersRes] = await Promise.all([
        api.get(`/workspaces/${slug}`),
        api.get(`/workspaces/${slug}/issues`),
        api.get(`/workspaces/${slug}/members`),
      ]);
      setWorkspace(wsRes.data.data);
      setIssues(issuesRes.data.data);
      setMembers(membersRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterStatus ? issues.filter(i => i.status === filterStatus) : issues;

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Loading workspace...
    </div>
  );

  if (!workspace) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
      Workspace not found.
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '0 24px',
        height: '52px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{workspace.name}</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '4px' }}>
            {workspace.slug}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '-4px' }}>
            {members.slice(0, 4).map((m: any) => (
              <div key={m.userId} title={m.user.name} style={{
                width: '26px', height: '26px', borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
                border: '2px solid var(--bg-sidebar)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, color: '#fff',
                marginLeft: '-4px',
              }}>
                {m.user.name[0].toUpperCase()}
              </div>
            ))}
            {members.length > 4 && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>+{members.length - 4}</span>}
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: '6px' }} /> New Issue
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        padding: '8px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '6px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setFilterStatus('')}
          style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            border: '1px solid', fontWeight: 500,
            borderColor: filterStatus === '' ? 'var(--brand-primary)' : 'var(--border-color)',
            color: filterStatus === '' ? 'var(--brand-primary)' : 'var(--text-tertiary)',
            backgroundColor: filterStatus === '' ? 'rgba(94,106,210,0.1)' : 'transparent',
          }}
        >All</button>
        {STATUSES.map(s => (
          <button key={s.key}
            onClick={() => setFilterStatus(s.key === filterStatus ? '' : s.key)}
            style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid`, fontWeight: 500,
              borderColor: filterStatus === s.key ? s.color : 'var(--border-color)',
              color: filterStatus === s.key ? s.color : 'var(--text-tertiary)',
              backgroundColor: filterStatus === s.key ? `${s.color}15` : 'transparent',
            }}
          >{s.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Issues List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '16px', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '40px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>No issues yet</div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} style={{ marginRight: '6px' }} /> Create first issue
            </Button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
              <span style={{ width: '8px' }} />
              <span style={{ width: '70px' }}>ID</span>
              <span style={{ flex: 1 }}>Title</span>
              <span style={{ width: '90px' }}>Status</span>
              <span style={{ width: '90px' }}>Label</span>
              <span style={{ width: '32px' }}>Assignee</span>
              <span style={{ width: '80px' }}>Due</span>
            </div>
            {filtered.map(issue => (
              <IssueRow key={issue.id} issue={issue} slug={slug!} members={members} onUpdated={load} />
            ))}
          </>
        )}
      </div>

      <CreateIssueModal
        slug={slug}
        members={members}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />
    </div>
  );
}
