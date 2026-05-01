import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useDashboard } from '../hooks/queries';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from '../components/Skeleton';

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
    <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', backgroundColor: `${color}20`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Skeleton width="44px" height="44px" borderRadius="var(--radius-md)" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="48px" height="26px" />
        <Skeleton width="80px" height="13px" />
      </div>
    </div>
  );
}

function IssuePill({ issue }: { issue: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.1s' }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: PRIORITY_COLORS[issue.priority] || 'var(--text-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{issue.identifier} · {STATUS_LABELS[issue.status]}</div>
      </div>
      {issue.dueDate && (
        <div style={{ fontSize: '11px', color: new Date(issue.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-tertiary)', flexShrink: 0 }}>
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

function IssuePillSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
      <Skeleton width="7px" height="7px" borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton height="13px" width="70%" />
        <Skeleton height="11px" width="40%" />
      </div>
    </div>
  );
}

function IssuePanel({ title, count, issues, isLoading, emptyMessage }: { title: string; count?: number; issues: any[]; isLoading: boolean; emptyMessage: string }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
        {count !== undefined && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{count}</span>}
      </div>
      <div>
        {isLoading ? (
          [0, 1, 2].map(i => <IssuePillSkeleton key={i} />)
        ) : issues.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>{emptyMessage}</div>
        ) : (
          issues.slice(0, 8).map(i => <IssuePill key={i.id} issue={i} />)
        )}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { summary, myIssues, overdue } = useDashboard();

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Good {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Here's what's happening across your workspaces.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {summary.isLoading ? (
          [0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={<TrendingUp size={20} />} label="Total Issues" value={summary.data?.total ?? 0} color="var(--brand-primary)" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Done" value={summary.data?.byStatus?.DONE ?? 0} color="var(--success)" />
            <StatCard icon={<Clock size={20} />} label="In Progress" value={summary.data?.byStatus?.IN_PROGRESS ?? 0} color="var(--warning)" />
            <StatCard icon={<AlertCircle size={20} />} label="Overdue" value={summary.data?.overdueCount ?? 0} color="var(--danger)" />
          </>
        )}
      </div>

      {/* Issue Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <IssuePanel
          title="My Issues" count={myIssues.data?.length}
          issues={myIssues.data ?? []} isLoading={myIssues.isLoading}
          emptyMessage="Nothing assigned to you 🎉"
        />
        <IssuePanel
          title="Overdue" count={overdue.data?.length}
          issues={overdue.data ?? []} isLoading={overdue.isLoading}
          emptyMessage="No overdue issues 🚀"
        />
      </div>

      {/* Status Breakdown */}
      {!summary.isLoading && summary.data && (
        <div style={{ marginTop: '20px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Status Breakdown</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(summary.data.byStatus).map(([status, count]) => (
              <div key={status} style={{ padding: '5px 12px', backgroundColor: 'var(--bg-app)', borderRadius: '20px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
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
