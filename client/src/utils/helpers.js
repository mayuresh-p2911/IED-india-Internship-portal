// ═══════════════════════════════════════════════════════════
// IED India IMS — Utility Helpers (React port)
// ═══════════════════════════════════════════════════════════

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const statusBadge = (status) =>
  `<span class="status-badge status-${status}">${(status || '').replace(/_/g, ' ')}</span>`;

export const priorityBadge = (p) =>
  `<span class="status-badge priority-${p}">${p}</span>`;

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const isOverdue = (deadline) =>
  deadline && new Date(deadline) < new Date();

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
