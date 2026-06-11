/* ==========================================================
   applications.js  –  IED India Internship Management System
   ========================================================== */

window.ApplicationsModule = (() => {
  let _apps = [];

  const STATUS_FLOW = {
    applied: ['shortlisted', 'rejected', 'on_hold'],
    shortlisted: ['interview_scheduled', 'rejected', 'on_hold'],
    interview_scheduled: ['selected', 'rejected', 'on_hold'],
    on_hold: ['shortlisted', 'rejected'],
    selected: [],
    rejected: [],
  };

  const STATUS_LABELS = {
    applied: 'Applied',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview Scheduled',
    selected: 'Selected',
    rejected: 'Rejected',
    on_hold: 'On Hold',
  };

  const STATUS_COLORS = {
    applied: '#4f8ef7',
    shortlisted: '#00d4ff',
    interview_scheduled: '#ffd700',
    selected: '#00e676',
    rejected: '#ff5252',
    on_hold: '#ff9100',
  };

  async function render() {
    const pc = document.getElementById('page-content');
    const role = window.Auth?.user?.role;
    const canAct = role === 'admin' || role === 'hr';

    pc.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Applications</h1>
      </div>
      <!-- mini stat cards -->
      <div id="app-stats" class="stats-grid" style="grid-template-columns:repeat(6,1fr)">
        ${Object.keys(STATUS_LABELS).map(() => `<div class="stat-card skeleton" style="height:80px"></div>`).join('')}
      </div>
      <!-- filter bar -->
      <div class="filter-bar" style="margin-top:1.5rem">
        <div class="form-group" style="margin:0;flex:1">
          <input type="text" id="app-search" class="form-control" placeholder="Search name, email, college…">
        </div>
        <select id="app-status-filter" class="form-control" style="width:180px">
          <option value="">All Statuses</option>
          ${Object.entries(STATUS_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <select id="app-dept-filter" class="form-control" style="width:160px">
          <option value="">All Departments</option>
          ${['Technology','Design','Marketing','Finance','Operations','HR'].map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
        <button class="btn btn-secondary" id="app-filter-btn"><i data-lucide="filter"></i> Filter</button>
      </div>
      <!-- table -->
      <div class="table-container" style="margin-top:1rem">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>College</th><th>Department</th>
              <th>Duration</th><th>Status</th><th>Applied Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="apps-tbody">
            <tr><td colspan="8" style="text-align:center;padding:2rem"><div class="loading"><div class="spinner"></div></div></td></tr>
          </tbody>
        </table>
      </div>`;

    lucide.createIcons();

    document.getElementById('app-filter-btn')?.addEventListener('click', _applyFilters);
    document.getElementById('app-search')?.addEventListener('keyup', e => { if (e.key === 'Enter') _applyFilters(); });

    await _loadApps();
  }

  async function _loadApps(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await window.API.get('/applications' + (qs ? '?' + qs : ''));
      _apps = res.applications || res || [];
      _renderStats(_apps);
      _renderTable(_apps);
    } catch (err) {
      document.getElementById('apps-tbody').innerHTML =
        `<tr><td colspan="8" style="text-align:center;color:#ff5252">Failed to load: ${err.message}</td></tr>`;
      window.showToast(err.message, 'error');
    }
  }

  function _applyFilters() {
    const search = document.getElementById('app-search')?.value.trim();
    const status = document.getElementById('app-status-filter')?.value;
    const dept = document.getElementById('app-dept-filter')?.value;
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (dept) params.department = dept;
    _loadApps(params);
  }

  function _renderStats(apps) {
    const counts = {};
    Object.keys(STATUS_LABELS).forEach(k => counts[k] = 0);
    apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

    document.getElementById('app-stats').innerHTML = Object.entries(STATUS_LABELS).map(([k, v]) => `
      <div class="stat-card" style="cursor:pointer" onclick="document.getElementById('app-status-filter').value='${k}';window.ApplicationsModule._applyFilters&&_applyFilters()">
        <div class="stat-info">
          <div class="stat-value" style="color:${STATUS_COLORS[k]}">${counts[k]}</div>
          <div class="stat-label" style="font-size:.75rem">${v}</div>
        </div>
      </div>`).join('');
  }

  function _renderTable(apps) {
    const tbody = document.getElementById('apps-tbody');
    const canAct = ['admin','hr'].includes(window.Auth?.user?.role);

    if (!apps.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i data-lucide="file-text"></i><p>No applications found</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = apps.map(a => {
      const nextStatuses = canAct ? (STATUS_FLOW[a.status] || []) : [];
      return `
      <tr data-id="${a._id}">
        <td style="font-weight:500;color:var(--text-primary)">${a.name||a.applicantName||''}</td>
        <td style="color:var(--text-secondary)">${a.email||''}</td>
        <td>${a.college||'—'}</td>
        <td>${a.department||'—'}</td>
        <td>${a.duration ? a.duration + ' months' : '—'}</td>
        <td>
          <span class="status-badge" style="background:${STATUS_COLORS[a.status]}22;color:${STATUS_COLORS[a.status]};border-color:${STATUS_COLORS[a.status]}44" id="status-badge-${a._id}">
            ${STATUS_LABELS[a.status] || a.status}
          </span>
        </td>
        <td style="color:var(--text-muted)">${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}</td>
        <td>
          <div style="display:flex;gap:.3rem;flex-wrap:wrap">
            <button class="btn btn-sm btn-ghost view-btn" data-id="${a._id}"><i data-lucide="eye"></i></button>
            ${canAct ? nextStatuses.map(s => `
              <button class="btn btn-sm ${s==='selected'?'btn-primary':s==='rejected'?'btn-danger':'btn-secondary'} status-btn"
                data-id="${a._id}" data-status="${s}" title="${STATUS_LABELS[s]}">
                ${_statusIcon(s)}
              </button>`).join('') : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    lucide.createIcons();

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const app = _apps.find(a => a._id === btn.dataset.id);
        if (app) _showDetails(app);
      });
    });

    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => _changeStatus(btn.dataset.id, btn.dataset.status));
    });
  }

  function _statusIcon(s) {
    const icons = {
      shortlisted: '<i data-lucide="check"></i>',
      interview_scheduled: '<i data-lucide="calendar"></i>',
      selected: '<i data-lucide="user-check"></i>',
      rejected: '<i data-lucide="x"></i>',
      on_hold: '<i data-lucide="pause"></i>',
    };
    return icons[s] || s;
  }

  function _showDetails(app) {
    const body = `
      <div class="form-section">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:2rem">
          <div style="flex:1;display:flex;flex-direction:column;gap:1rem">
            <div class="form-row" style="gap:2rem">
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Full Name</div>
                <div style="color:var(--text-primary);font-weight:500">${app.name||app.applicantName||'—'}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Email</div>
                <div style="color:var(--text-primary)">${app.email||'—'}</div>
              </div>
            </div>
            <div class="form-row" style="gap:2rem">
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Phone</div>
                <div>${app.phone||'—'}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">College / University</div>
                <div>${app.college||'—'}</div>
              </div>
            </div>
            <div class="form-row" style="gap:2rem">
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Department Applied</div>
                <div>${app.department||'—'}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Duration</div>
                <div>${app.duration ? app.duration + ' months' : '—'}</div>
              </div>
            </div>
            <div class="form-row" style="gap:2rem">
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Status</div>
                <span class="status-badge" style="background:${STATUS_COLORS[app.status]}22;color:${STATUS_COLORS[app.status]}">${STATUS_LABELS[app.status]||app.status}</span>
              </div>
              <div style="flex:1">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.2rem">Applied On</div>
                <div>${app.createdAt ? new Date(app.createdAt).toLocaleString('en-IN') : '—'}</div>
              </div>
            </div>
          </div>
          <!-- Applicant Photo -->
          <div style="width:120px;text-align:center;flex-shrink:0">
            <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem">Applicant Photo</div>
            <div style="width:120px;height:140px;border-radius:var(--radius-md);border:1px solid var(--border-color);overflow:hidden;background:#f0f4f8;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm)">
              ${app.photo ? `
                <img src="${app.photo}" style="width:100%;height:100%;object-fit:cover;cursor:pointer" onclick="window.open('${app.photo}','_blank')" title="Click to view full image" />
              ` : `
                <i data-lucide="user" style="width:40px;height:40px;color:var(--text-muted)"></i>
              `}
            </div>
          </div>
        </div>

        ${app.coverLetter || app.message ? `
        <div style="margin-top:1.5rem">
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem">Cover Letter / Message</div>
          <div style="background:#f4f6fa;border-radius:8px;padding:1rem;color:var(--text-secondary);font-size:.9rem;line-height:1.6;border:1px solid var(--border-color)">${app.coverLetter||app.message}</div>
        </div>` : ''}

        ${app.skills?.length ? `
        <div style="margin-top:1.5rem">
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem">Skills</div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">${app.skills.map(s=>`<span class="status-badge status-active" style="background:rgba(3, 55, 122, 0.08);color:var(--accent-blue);font-weight:600;text-transform:none">${s}</span>`).join('')}</div>
        </div>` : ''}

        ${app.resume ? `
        <div style="margin-top:1.5rem;border-top:1px solid var(--border-color);padding-top:1.5rem">
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:center">
            <span>Uploaded Resume</span>
            <a href="${app.resume}" target="_blank" class="btn btn-secondary btn-sm" style="padding:4px 10px;font-size:0.75rem;border-radius:4px"><i data-lucide="external-link" style="width:12px;height:12px"></i> Open in New Tab</a>
          </div>
          <div style="width:100%;height:380px;border-radius:var(--radius-md);border:1px solid var(--border-color);overflow:hidden;background:#f0f4f8">
            ${app.resume.toLowerCase().endsWith('.pdf') ? `
              <iframe src="${app.resume}" style="width:100%;height:100%;border:none"></iframe>
            ` : ['jpg','jpeg','png','gif','webp'].includes(app.resume.split('.').pop().toLowerCase()) ? `
              <img src="${app.resume}" style="width:100%;height:100%;object-fit:contain;background:#f4f6fa" />
            ` : `
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);gap:8px">
                <i data-lucide="file-text" style="width:48px;height:48px;color:var(--text-muted)"></i>
                <span>Preview not available for this file type.</span>
                <a href="${app.resume}" download class="btn btn-primary btn-sm"><i data-lucide="download"></i> Download to View</a>
              </div>
            `}
          </div>
        </div>
        ` : `
        <div style="margin-top:1.5rem;border-top:1px solid var(--border-color);padding-top:1.5rem;color:var(--text-muted);font-size:0.85rem">
          <i data-lucide="alert-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i>No resume uploaded.
        </div>`}
      </div>`;

    window.showModal('Application Details', body, `<button class="btn btn-secondary" onclick="window.closeModal()">Close</button>`);
    lucide.createIcons();
  }

  async function _changeStatus(id, newStatus) {
    if (newStatus === 'selected') {
      if (!confirm(`Confirm: Mark this applicant as SELECTED? This will proceed to onboarding.`)) return;
    }
    try {
      await window.API.patch(`/applications/${id}/status`, { status: newStatus });
      const badge = document.getElementById(`status-badge-${id}`);
      if (badge) {
        badge.textContent = STATUS_LABELS[newStatus] || newStatus;
        badge.style.background = STATUS_COLORS[newStatus] + '22';
        badge.style.color = STATUS_COLORS[newStatus];
        badge.style.borderColor = STATUS_COLORS[newStatus] + '44';
        /* animate */
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => { badge.style.transform = 'scale(1)'; }, 300);
      }
      /* update local */
      const app = _apps.find(a => a._id === id);
      if (app) app.status = newStatus;
      /* re-render row actions */
      _renderTable(_apps);
      _renderStats(_apps);
      window.showToast(`Status updated to "${STATUS_LABELS[newStatus]}"`, 'success');

      if (newStatus === 'interview_scheduled') {
        window.showToast('Head to Interviews module to schedule the interview!', 'info');
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to update status', 'error');
    }
  }

  return { render };
})();
