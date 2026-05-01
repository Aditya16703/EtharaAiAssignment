import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog', TODO: 'Todo', IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review', DONE: 'Done', CANCELLED: 'Cancelled',
};
const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'var(--priority-urgent)', HIGH: 'var(--priority-high)',
  MEDIUM: 'var(--priority-medium)', LOW: 'var(--priority-low)', NO_PRIORITY: 'var(--text-tertiary)',
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '44px', height: '44px',
        backgroundColor: `${color}20`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

function IssuePill({ issue }: { issue: any }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      transition: 'background 0.15s',
    }}
      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIORITY_COLORS[issue.priority] || 'var(--text-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{issue.identifier} · {STATUS_LABELS[issue.status]}</div>
      </div>
      {issue.dueDate && (
        <div style={{ fontSize: '12px', color: new Date(issue.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-tertiary)', flexShrink: 0 }}>
          {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
      {issue.workspace && (
        <Link to={`/app/${issue.workspace.slug}`} style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-secondary)', flexShrink: 0 }}>
          {issue.workspace.name}
        </Link>
      )}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, myRes, overRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/my-issues'),
          api.get('/dashboard/overdue'),
        ]);
        setSummary(sumRes.data.data);
        setMyIssues(myRes.data.data);
        setOverdue(overRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Good {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Here's what's happening across your workspaces.
        </p>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <StatCard icon={<TrendingUp size={20} />} label="Total Issues" value={summary.total} color="var(--brand-primary)" />
          <StatCard icon={<CheckCircle2 size={20} />} label="Done" value={summary.byStatus.DONE} color="var(--success)" />
          <StatCard icon={<Clock size={20} />} label="In Progress" value={summary.byStatus.IN_PROGRESS} color="var(--warning)" />
          <StatCard icon={<AlertCircle size={20} />} label="Overdue" value={summary.overdueCount} color="var(--danger)" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* My Issues */}
        <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>My Issues</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{myIssues.length}</span>
          </div>
          <div>
            {myIssues.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                Nothing assigned to you 🎉
              </div>
            ) : (
              myIssues.slice(0, 6).map(issue => <IssuePill key={issue.id} issue={issue} />)
            )}
          </div>
        </div>

        {/* Overdue */}
        <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Overdue</h2>
            <span style={{ fontSize: '12px', color: overdue.length > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }}>{overdue.length}</span>
          </div>
          <div>
            {overdue.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No overdue issues 🚀
              </div>
            ) : (
              overdue.slice(0, 6).map(issue => <IssuePill key={issue.id} issue={issue} />)
            )}
          </div>
        </div>
      </div>

      {summary && (
        <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Status Breakdown</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} style={{
                padding: '6px 14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '20px',
                fontSize: '13px',
                display: 'flex', gap: '6px', alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{STATUS_LABELS[status]}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
