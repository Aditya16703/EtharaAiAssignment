import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace, useMembers, useIssues, useCreateIssue, useUpdateIssueStatus, useDeleteIssue } from '../hooks/queries';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';

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

function IssueRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 20px', borderBottom: '1px solid var(--border-color)' }}>
      <Skeleton width="8px" height="8px" borderRadius="50%" />
      <Skeleton width="52px" height="12px" />
      <Skeleton height="14px" style={{ flex: 1 }} />
      <Skeleton width="80px" height="22px" borderRadius="20px" />
      <Skeleton width="24px" height="24px" borderRadius="50%" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find(x => x.key === status);
  return (
    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', border: `1px solid ${s?.color}40`, color: s?.color, backgroundColor: `${s?.color}15`, whiteSpace: 'nowrap' }}>
      {s?.label || status}
    </span>
  );
}

function IssueRow({ issue, slug }: { issue: any; slug: string }) {
  const updateStatus = useUpdateIssueStatus(slug);
  const deleteIssue = useDeleteIssue(slug);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.1s', cursor: 'default' }}
      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIORITY_COLORS[issue.priority] || '#3f3f46', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace', flexShrink: 0, minWidth: '56px' }}>{issue.identifier}</span>
      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>

      <select
        value={issue.status}
        onChange={e => updateStatus.mutate({ id: issue.id, status: e.target.value })}
        disabled={updateStatus.isPending}
        title="Change status"
        style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
      >
        {STATUSES.map(s => <option key={s.key} value={s.key} style={{ backgroundColor: 'var(--bg-panel)' }}>{s.label}</option>)}
      </select>

      <StatusBadge status={issue.status} />

      {issue.assignee ? (
        <div title={issue.assignee.name} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {issue.assignee.name[0].toUpperCase()}
        </div>
      ) : (
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px dashed var(--border-color)', flexShrink: 0 }} />
      )}

      {issue.dueDate && (
        <span style={{ fontSize: '12px', flexShrink: 0, color: new Date(issue.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-tertiary)' }}>
          {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      <button
        onClick={() => deleteIssue.mutate(issue.id)}
        disabled={deleteIssue.isPending}
        title="Delete issue"
        style={{ color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', opacity: 0, transition: 'opacity 0.15s' }}
        onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function CreateIssueModal({ slug, isOpen, onClose }: { slug: string; isOpen: boolean; onClose: () => void }) {
  const { data: members = [] } = useMembers(slug);
  const createIssue = useCreateIssue(slug);
  const [form, setForm] = useState({ title: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createIssue.mutateAsync({
        title: form.title,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      });
      setForm({ title: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create issue');
    }
  };

  const selectStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: '14px', width: '100%' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Issue">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Issue title..." required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={selectStyle}>
              {PRIORITIES.map(p => <option key={p} value={p} style={{ backgroundColor: 'var(--bg-panel)' }}>{p.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Assignee</label>
            <select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))} style={selectStyle}>
              <option value="" style={{ backgroundColor: 'var(--bg-panel)' }}>Unassigned</option>
              {members.map((m: any) => <option key={m.userId} value={m.userId} style={{ backgroundColor: 'var(--bg-panel)' }}>{m.user.name}</option>)}
            </select>
          </div>
        </div>
        <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createIssue.isPending}>{createIssue.isPending ? 'Creating...' : 'Create Issue'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [filterStatus, setFilterStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspace, isLoading: wsLoading } = useWorkspace(slug!);
  const { data: members = [] } = useMembers(slug!);
  const { data: issues = [], isLoading: issuesLoading } = useIssues(slug!, filterStatus ? { status: filterStatus } : {});

  if (wsLoading) {
    return (
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton height="20px" width="180px" />
        <Skeleton height="14px" width="80px" />
        {[0, 1, 2, 3, 4].map(i => <IssueRowSkeleton key={i} />)}
      </div>
    );
  }

  if (!workspace) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontSize: '14px' }}>Workspace not found.</div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ padding: '0 24px', height: '52px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{workspace.name}</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '4px' }}>{workspace.slug}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Member avatars */}
          <div style={{ display: 'flex' }}>
            {members.slice(0, 5).map((m: any, i: number) => (
              <div key={m.userId} title={m.user.name} style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', border: '2px solid var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', marginLeft: i === 0 ? 0 : '-6px', zIndex: i }}>
                {m.user.name[0].toUpperCase()}
              </div>
            ))}
            {members.length > 5 && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px', alignSelf: 'center' }}>+{members.length - 5}</span>}
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: '6px' }} />New Issue
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, overflowX: 'auto' }}>
        {[{ key: '', label: 'All' }, ...STATUSES].map(s => (
          <button key={s.key}
            onClick={() => setFilterStatus(s.key === filterStatus ? '' : s.key)}
            style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid', fontWeight: 500, whiteSpace: 'nowrap',
              borderColor: filterStatus === s.key ? ((s as any).color || 'var(--brand-primary)') : 'var(--border-color)',
              color: filterStatus === s.key ? ((s as any).color || 'var(--brand-primary)') : 'var(--text-tertiary)',
              backgroundColor: filterStatus === s.key ? `${(s as any).color || '#5e6ad2'}15` : 'transparent',
            }}
          >{s.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Issues */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {issuesLoading ? (
          [0, 1, 2, 3, 4].map(i => <IssueRowSkeleton key={i} />)
        ) : issues.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '12px', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '36px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>No issues {filterStatus ? 'with this status' : 'yet'}</div>
            {!filterStatus && <Button onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: '6px' }} />Create first issue</Button>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
              <span style={{ width: '8px' }} />
              <span style={{ minWidth: '56px' }}>ID</span>
              <span style={{ flex: 1 }}>Title</span>
              <span>Status</span>
              <span style={{ width: '80px' }}>Label</span>
              <span style={{ width: '32px' }}>Who</span>
            </div>
            {issues.map((issue: any) => <IssueRow key={issue.id} issue={issue} slug={slug!} />)}
          </>
        )}
      </div>

      <CreateIssueModal slug={slug!} isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
