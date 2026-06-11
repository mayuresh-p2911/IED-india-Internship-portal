// ═══════════════════════════════════════════════════════════
// IED India IMS — API Helper
// ═══════════════════════════════════════════════════════════

const API = (() => {
  const BASE = '/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('ied_token') || ''}`
  });

  const request = async (method, path, body = null, isFormData = false) => {
    const opts = { method, headers: isFormData ? { 'Authorization': `Bearer ${localStorage.getItem('ied_token') || ''}` } : getHeaders() };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    try {
      const res = await fetch(`${BASE}${path}`, opts);
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text || `HTTP ${res.status}: ${res.statusText}` };
      }
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return {
    get:    (path)               => request('GET', path),
    post:   (path, body, fd)     => request('POST', path, body, fd),
    put:    (path, body)         => request('PUT', path, body),
    patch:  (path, body)         => request('PATCH', path, body),
    delete: (path)               => request('DELETE', path),
    upload: (path, formData)     => request('POST', path, formData, true),
    uploadPut: (path, formData)  => request('PUT', path, formData, true),
  };
})();

window.API = API;

// ── Toast Notification ────────────────────────────────────
window.showToast = (message, type = 'info', duration = 3500) => {
  const container = document.getElementById('toast-container');
  const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
  const colors = { success: '#00e676', error: '#ff5252', info: '#4f8ef7' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type]}" style="width:18px;height:18px;color:${colors[type]};flex-shrink:0"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
};

// ── Modal ─────────────────────────────────────────────────
window.showModal = (title, bodyHTML, footerHTML = '') => {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  document.getElementById('modal-overlay').classList.remove('hidden');
  lucide.createIcons();
};

window.closeModal = () => {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-footer').innerHTML = '';
};

document.getElementById('modal-close').addEventListener('click', window.closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) window.closeModal();
});

// ── Utility Helpers ───────────────────────────────────────
window.formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
window.formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
window.timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

window.statusBadge = (status) => `<span class="status-badge status-${status}">${status.replace(/_/g, ' ')}</span>`;
window.priorityBadge = (p) => `<span class="status-badge priority-${p}">${p}</span>`;

window.getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

window.isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

window.renderLoading = () => `<div class="loading"><div class="spinner"></div></div>`;
window.renderEmpty = (msg = 'No data found', sub = '') => `
  <div class="empty-state">
    <div class="empty-icon"><i data-lucide="inbox" style="width:48px;height:48px;color:var(--text-muted)"></i></div>
    <h3>${msg}</h3>
    <p>${sub}</p>
  </div>`;
