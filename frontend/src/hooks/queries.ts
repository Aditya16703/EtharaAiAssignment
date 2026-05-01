import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const keys = {
  me: ['me'] as const,
  workspaces: ['workspaces'] as const,
  workspace: (slug: string) => ['workspaces', slug] as const,
  members: (slug: string) => ['workspaces', slug, 'members'] as const,
  issues: (slug: string, filters?: Record<string, string>) =>
    filters ? ['workspaces', slug, 'issues', filters] : ['workspaces', slug, 'issues'],
  dashboardSummary: ['dashboard', 'summary'] as const,
  dashboardMyIssues: ['dashboard', 'my-issues'] as const,
  dashboardOverdue: ['dashboard', 'overdue'] as const,
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get('/auth/me').then(r => r.data.data.user),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

// ── Workspaces ────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  return useQuery({
    queryKey: keys.workspaces,
    queryFn: () => api.get('/workspaces').then(r => r.data.data),
    staleTime: 30_000,
  });
}

export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: keys.workspace(slug),
    queryFn: () => api.get(`/workspaces/${slug}`).then(r => r.data.data),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; logoUrl?: string }) =>
      api.post('/workspaces', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.workspaces });
    },
  });
}

// ── Members ───────────────────────────────────────────────────────────────────
export function useMembers(slug: string) {
  return useQuery({
    queryKey: keys.members(slug),
    queryFn: () => api.get(`/workspaces/${slug}/members`).then(r => r.data.data),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useInviteMember(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post(`/workspaces/${slug}/members`, { email }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.members(slug) });
    },
  });
}

// ── Issues ────────────────────────────────────────────────────────────────────
export function useIssues(slug: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: keys.issues(slug, filters),
    queryFn: () =>
      api.get(`/workspaces/${slug}/issues${params ? `?${params}` : ''}`).then(r => r.data.data),
    enabled: !!slug,
    staleTime: 15_000,
  });
}

export function useCreateIssue(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
    }) => api.post(`/workspaces/${slug}/issues`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.issues(slug) });
      qc.invalidateQueries({ queryKey: keys.dashboardSummary });
    },
  });
}

export function useUpdateIssueStatus(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/workspaces/${slug}/issues/${id}/status`, { status }).then(r => r.data.data),

    // ── Optimistic update ──────────────────────────────────────────────────
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: keys.issues(slug) });

      // Snapshot previous data
      const previousIssues = qc.getQueriesData({ queryKey: keys.issues(slug) });

      // Optimistically update every cached filter variant
      qc.setQueriesData({ queryKey: keys.issues(slug) }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((issue: any) =>
          issue.id === id ? { ...issue, status } : issue
        );
      });

      return { previousIssues };
    },

    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previousIssues) {
        context.previousIssues.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.issues(slug) });
      qc.invalidateQueries({ queryKey: keys.dashboardSummary });
    },
  });
}

export function useUpdateIssue(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; priority?: string; dueDate?: string | null }) =>
      api.patch(`/workspaces/${slug}/issues/${id}`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.issues(slug) });
    },
  });
}

export function useDeleteIssue(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${slug}/issues/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.issues(slug) });
      const previousIssues = qc.getQueriesData({ queryKey: keys.issues(slug) });
      qc.setQueriesData({ queryKey: keys.issues(slug) }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((issue: any) => issue.id !== id);
      });
      return { previousIssues };
    },
    onError: (_err, _id, context) => {
      context?.previousIssues?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.issues(slug) });
      qc.invalidateQueries({ queryKey: keys.dashboardSummary });
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useDashboard() {
  const summary = useQuery({
    queryKey: keys.dashboardSummary,
    queryFn: () => api.get('/dashboard/summary').then(r => r.data.data),
    staleTime: 30_000,
  });

  const myIssues = useQuery({
    queryKey: keys.dashboardMyIssues,
    queryFn: () => api.get('/dashboard/my-issues').then(r => r.data.data),
    staleTime: 15_000,
  });

  const overdue = useQuery({
    queryKey: keys.dashboardOverdue,
    queryFn: () => api.get('/dashboard/overdue').then(r => r.data.data),
    staleTime: 15_000,
  });

  return { summary, myIssues, overdue };
}
