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

    pc.innerHTML = `
      <div class="page-header">
        <div><h2>Applications</h2><p>Review and manage internship applications</p></div>
      </div>
      <!-- mini stat cards -->
      <div id="app-stats" class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
        ${Object.keys(STATUS_LABELS).map(() => `<div class="stat-card skeleton" style="height:80px"></div>`).join('')}
      </div>
      <!-- filter bar -->
      <div class="filter-bar" style="margin-top:1.5rem">
        <div class="search-input" style="flex:1"><i data-lucide="search"></i><input type="text" id="app-search" placeholder="Search name, email, college…"></div>
        <select id="app-status-filter">
          <option value="">All Statuses</option>
          ${Object.entries(STATUS_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <button class="btn btn-secondary" id="app-filter-btn"><i data-lucide="filter"></i> Filter</button>
      </div>
      <!-- table -->
      <div class="table-container glass-card" style="margin-top:1rem">
        <table>
          <thead><tr>
            <th>Name</th><th>Email</th><th>College</th><th>Department</th>
            <th>Duration</th><th>Status</th><th>Applied</th><th>Actions</th>
          </tr></thead>
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
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    _loadApps(params);
  }

  function _renderStats(apps) {
    const counts = {};
    Object.keys(STATUS_LABELS).forEach(k => counts[k] = 0);
    apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

    document.getElementById('app-stats').innerHTML = Object.entries(STATUS_LABELS).map(([k, v]) => `
      <div class="stat-card" style="cursor:pointer" onclick="document.getElementById('app-status-filter').value='${k}';window.ApplicationsModule && render()">
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
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📋</div><h3>No applications found</h3><p>Applications submitted by candidates will appear here</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = apps.map(a => {
      const nextStatuses = canAct ? (STATUS_FLOW[a.status] || []) : [];
      return `
      <tr data-id="${a._id}">
        <td style="font-weight:600">${a.name||''}</td>
        <td style="color:var(--text-secondary);font-size:0.82rem">${a.email||''}</td>
        <td style="font-size:0.82rem">${a.college||'—'}</td>
        <td style="font-size:0.82rem">${a.department||'—'}</td>
        <td style="font-size:0.82rem">${a.duration ? a.duration + ' wks' : '—'}</td>
        <td>
          <span class="status-badge" style="background:${STATUS_COLORS[a.status]}22;color:${STATUS_COLORS[a.status]};border:1px solid ${STATUS_COLORS[a.status]}44" id="status-badge-${a._id}">
            ${STATUS_LABELS[a.status] || a.status}
          </span>
        </td>
        <td style="color:var(--text-muted);font-size:0.8rem">${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}</td>
        <td>
          <div style="display:flex;gap:.3rem;flex-wrap:wrap">
            <button class="btn btn-sm btn-ghost view-btn" data-id="${a._id}" title="View details"><i data-lucide="eye"></i></button>
            ${canAct ? nextStatuses.map(s => `
              <button class="btn btn-sm ${s==='selected'?'btn-primary':s==='rejected'?'btn-danger':s==='shortlisted'?'btn-success':'btn-secondary'} status-btn"
                data-id="${a._id}" data-status="${s}" data-name="${a.name}" data-email="${a.email}" title="${STATUS_LABELS[s]}">
                ${_statusIcon(s)}&nbsp;${STATUS_LABELS[s]}
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
      btn.addEventListener('click', () => _handleStatusChange(btn.dataset.id, btn.dataset.status, btn.dataset.name));
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
    return icons[s] || '';
  }

  // Central status change handler — shows reason modal for rejection, confirms for selection
  async function _handleStatusChange(id, newStatus, name) {
    if (newStatus === 'rejected') {
      // Show reason modal
      _showRejectionModal(id, name, 'application');
      return;
    }

    if (newStatus === 'selected') {
      if (!confirm(`Accept ${name} as an intern?\n\nThis will:\n• Create their portal login account\n• Send login credentials to their email\n• Begin the onboarding process`)) return;
    } else if (newStatus === 'shortlisted') {
      if (!confirm(`Shortlist ${name}?\nAn email will be sent notifying them of the update.`)) return;
    } else if (newStatus === 'interview_scheduled') {
      window.showToast('Please schedule the interview in the Interviews tab!', 'info');
      return;
    }

    await _changeStatus(id, newStatus);
  }

  // Show rejection reason modal
  function _showRejectionModal(id, name, context) {
    window.showModal(
      `Reject ${context === 'application' ? 'Application' : 'After Interview'}`,
      `<div style="display:flex;flex-direction:column;gap:16px">
        <p style="color:var(--text-secondary)">You are about to reject <strong>${name}</strong>'s ${context}. An email will be sent to the applicant.</p>
        <div class="form-group">
          <label>Reason for Rejection <span style="color:var(--text-muted)">(optional — will be included in the email)</span></label>
          <textarea id="rejection-reason" rows="4" placeholder="e.g. We had a high volume of applications this time. We encourage you to apply again in the future..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-danger" id="confirm-reject-btn"><i data-lucide="x"></i> Confirm Rejection</button>`
    );
    lucide.createIcons();
    document.getElementById('confirm-reject-btn')?.addEventListener('click', async () => {
      const reason = document.getElementById('rejection-reason')?.value.trim();
      window.closeModal();
      await _changeStatus(id, 'rejected', reason);
    });
  }

  async function _changeStatus(id, newStatus, rejectionReason = '') {
    try {
      const body = { status: newStatus };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      await window.API.patch(`/applications/${id}/status`, body);

      const badge = document.getElementById(`status-badge-${id}`);
      if (badge) {
        badge.textContent = STATUS_LABELS[newStatus] || newStatus;
        badge.style.background = STATUS_COLORS[newStatus] + '22';
        badge.style.color = STATUS_COLORS[newStatus];
        badge.style.borderColor = STATUS_COLORS[newStatus] + '44';
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => { badge.style.transform = 'scale(1)'; }, 300);
      }
      const app = _apps.find(a => a._id === id);
      if (app) app.status = newStatus;
      _renderTable(_apps);
      _renderStats(_apps);

      const messages = {
        shortlisted: '✅ Applicant shortlisted. Email sent.',
        rejected: '❌ Rejection email sent to applicant.',
        selected: '🎉 Intern account created! Login credentials emailed.',
        on_hold: 'Application placed on hold.',
        interview_scheduled: 'Status updated.',
      };
      window.showToast(messages[newStatus] || `Status updated to "${STATUS_LABELS[newStatus]}"`, newStatus === 'rejected' ? 'info' : 'success');

      if (newStatus === 'shortlisted') {
        window.showToast('Next step: Go to Interviews to schedule their interview.', 'info');
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to update status', 'error');
    }
  }

  function _showDetails(app) {
    const body = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:2rem;flex-wrap:wrap">
          <div style="flex:1;display:flex;flex-direction:column;gap:1rem;min-width:200px">
            <div class="form-row">
              <div><div style="font-size:.75rem;color:var(--text-muted)">Full Name</div><div style="font-weight:600">${app.name||'—'}</div></div>
              <div><div style="font-size:.75rem;color:var(--text-muted)">Email</div><div>${app.email||'—'}</div></div>
            </div>
            <div class="form-row">
              <div><div style="font-size:.75rem;color:var(--text-muted)">Phone</div><div>${app.phone||'—'}</div></div>
              <div><div style="font-size:.75rem;color:var(--text-muted)">College</div><div>${app.college||'—'}</div></div>
            </div>
            <div class="form-row">
              <div><div style="font-size:.75rem;color:var(--text-muted)">Department</div><div>${app.department||'—'}</div></div>
              <div><div style="font-size:.75rem;color:var(--text-muted)">Duration</div><div>${app.duration ? app.duration + ' weeks' : '—'}</div></div>
            </div>
            <div class="form-row">
              <div>
                <div style="font-size:.75rem;color:var(--text-muted)">Status</div>
                <span class="status-badge" style="background:${STATUS_COLORS[app.status]}22;color:${STATUS_COLORS[app.status]}">${STATUS_LABELS[app.status]||app.status}</span>
              </div>
              <div><div style="font-size:.75rem;color:var(--text-muted)">Applied On</div><div>${app.createdAt ? new Date(app.createdAt).toLocaleString('en-IN') : '—'}</div></div>
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem">Photo</div>
            <div style="width:110px;height:130px;border-radius:var(--radius-md);border:1px solid var(--border-color);overflow:hidden;background:#f0f4f8;display:flex;align-items:center;justify-content:center">
              ${app.photo ? `<img src="${app.photo}" style="width:100%;height:100%;object-fit:cover;cursor:pointer" onclick="window.open('${app.photo}','_blank')" />` : `<i data-lucide="user" style="width:40px;height:40px;color:var(--text-muted)"></i>`}
            </div>
          </div>
        </div>

        ${app.coverLetter || app.message ? `
        <div style="margin-top:1.5rem">
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem">Cover Letter</div>
          <div style="background:#f4f6fa;border-radius:8px;padding:1rem;color:var(--text-secondary);font-size:.9rem;line-height:1.6;border:1px solid var(--border-color)">${app.coverLetter||app.message}</div>
        </div>` : ''}

        ${app.resume ? `
        <div style="margin-top:1.5rem;border-top:1px solid var(--border-color);padding-top:1.5rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
            <span style="font-size:.75rem;color:var(--text-muted)">Resume</span>
            <a href="${app.resume}" target="_blank" class="btn btn-secondary btn-sm"><i data-lucide="external-link" style="width:12px;height:12px"></i> Open</a>
          </div>
          <div style="width:100%;height:360px;border-radius:var(--radius-md);border:1px solid var(--border-color);overflow:hidden;background:#f0f4f8">
            ${app.resume.toLowerCase().endsWith('.pdf') ? `<iframe src="${app.resume}" style="width:100%;height:100%;border:none"></iframe>` :
              ['jpg','jpeg','png','gif','webp'].includes(app.resume.split('.').pop().toLowerCase()) ? `<img src="${app.resume}" style="width:100%;height:100%;object-fit:contain" />` :
              `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);gap:8px"><i data-lucide="file-text" style="width:48px;height:48px"></i><span>Preview unavailable</span><a href="${app.resume}" download class="btn btn-primary btn-sm"><i data-lucide="download"></i> Download</a></div>`}
          </div>
        </div>` : ''}
      </div>`;

    window.showModal('Application Details', body, `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`);
    lucide.createIcons();
  }

  return { render };
})();
