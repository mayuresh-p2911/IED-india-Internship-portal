/* ==========================================================
   interviews.js  –  IED India Internship Management System
   ========================================================== */

window.InterviewsModule = (() => {
  let _interviews = [];
  let _shortlistedApps = [];
  let _editingId = null;
  let _countdownTimers = [];

  function _clearTimers() {
    _countdownTimers.forEach(clearInterval);
    _countdownTimers = [];
  }

  function _fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _fmtTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  async function render() {
    _clearTimers();
    const pc = document.getElementById('page-content');
    const canManage = ['admin','hr'].includes(window.Auth?.user?.role);

    pc.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Interviews</h1>
        <div class="page-actions">
          ${canManage ? `<button class="btn btn-primary" id="schedule-btn"><i data-lucide="calendar-plus"></i> Schedule Interview</button>` : ''}
        </div>
      </div>
      <!-- stats -->
      <div id="iv-stats" class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        ${[1,2,3,4].map(() => `<div class="stat-card skeleton" style="height:90px"></div>`).join('')}
      </div>
      <!-- table -->
      <div class="table-container" style="margin-top:1.5rem">
        <table>
          <thead>
            <tr>
              <th>Candidate</th><th>Date</th><th>Time</th><th>Mode</th>
              <th>Meet Link</th><th>Interviewer</th><th>Status</th>
              <th>Score</th><th>Result</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="iv-tbody">
            <tr><td colspan="10" style="text-align:center;padding:2rem"><div class="loading"><div class="spinner"></div></div></td></tr>
          </tbody>
        </table>
      </div>`;

    lucide.createIcons();

    document.getElementById('schedule-btn')?.addEventListener('click', async () => {
      await _fetchShortlisted();
      _openScheduleModal(null);
    });

    await _loadInterviews();
  }

  async function _loadInterviews() {
    try {
      const res = await window.API.get('/interviews');
      _interviews = res.interviews || res || [];
      _renderStats(_interviews);
      _renderTable(_interviews);
    } catch (err) {
      document.getElementById('iv-tbody').innerHTML =
        `<tr><td colspan="10" style="text-align:center;color:#ff5252">Failed to load: ${err.message}</td></tr>`;
      window.showToast(err.message, 'error');
    }
  }

  async function _fetchShortlisted() {
    try {
      const res = await window.API.get('/applications?status=shortlisted');
      _shortlistedApps = res.applications || res || [];
    } catch (_) { _shortlistedApps = []; }
  }

  function _renderStats(ivs) {
    const counts = { scheduled: 0, completed: 0, pending: 0, cancelled: 0 };
    ivs.forEach(iv => {
      if (iv.status === 'scheduled') counts.scheduled++;
      else if (iv.status === 'completed') counts.completed++;
      else if (iv.status === 'pending') counts.pending++;
      else if (iv.status === 'cancelled') counts.cancelled++;
    });
    const defs = [
      { key: 'scheduled', label: 'Scheduled', icon: 'calendar', color: 'blue' },
      { key: 'completed', label: 'Completed', icon: 'check-circle', color: 'green' },
      { key: 'pending', label: 'Pending', icon: 'clock', color: 'gold' },
      { key: 'cancelled', label: 'Cancelled', icon: 'x-circle', color: 'red' },
    ];
    document.getElementById('iv-stats').innerHTML = defs.map(d => `
      <div class="stat-card">
        <div class="stat-icon ${d.color}"><i data-lucide="${d.icon}"></i></div>
        <div class="stat-info">
          <div class="stat-value">${counts[d.key]}</div>
          <div class="stat-label">${d.label}</div>
        </div>
      </div>`).join('');
    lucide.createIcons();
  }

  function _renderTable(ivs) {
    _clearTimers();
    const tbody = document.getElementById('iv-tbody');
    const canManage = ['admin','hr'].includes(window.Auth?.user?.role);

    if (!ivs.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i data-lucide="calendar"></i><p>No interviews scheduled</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = ivs.map(iv => {
      const isFuture = iv.scheduledAt && new Date(iv.scheduledAt) > new Date();
      const modeBadge = {
        zoom: 'blue', google_meet: 'green', offline: 'gold', phone: 'purple'
      }[iv.mode] || 'blue';
      const resultColor = iv.result === 'pass' ? '#00e676' : iv.result === 'fail' ? '#ff5252' : '#94a3b8';

      return `
      <tr>
        <td style="font-weight:500;color:var(--text-primary)">${iv.applicationId?.name || iv.candidateName || '—'}</td>
        <td>${_fmtDate(iv.scheduledAt)}</td>
        <td>
          ${_fmtTime(iv.scheduledAt)}
          ${isFuture ? `<div style="font-size:.7rem;color:#00d4ff" id="cd-${iv._id}">Loading…</div>` : ''}
        </td>
        <td><span class="status-badge status-${modeBadge}">${iv.mode||'—'}</span></td>
        <td>
          ${iv.meetLink ? `
            <div style="display:flex;align-items:center;gap:.4rem">
              <a href="${iv.meetLink}" target="_blank" class="btn btn-sm btn-ghost" title="Open"><i data-lucide="external-link"></i></a>
              <button class="btn btn-sm btn-ghost copy-link-btn" data-link="${iv.meetLink}" title="Copy"><i data-lucide="copy"></i></button>
            </div>` : '—'}
        </td>
        <td>${iv.interviewer || iv.interviewerId?.name || '—'}</td>
        <td><span class="status-badge status-${iv.status}">${iv.status||'—'}</span></td>
        <td>${iv.score != null ? iv.score + '/10' : '—'}</td>
        <td style="color:${resultColor};font-weight:500">${iv.result ? iv.result.charAt(0).toUpperCase()+iv.result.slice(1) : '—'}</td>
        <td>
          <div style="display:flex;gap:.3rem">
            ${canManage ? `<button class="btn btn-sm btn-secondary edit-iv-btn" data-id="${iv._id}" title="Edit/Review"><i data-lucide="edit-2"></i></button>` : ''}
            ${canManage && iv.status !== 'cancelled' ? `<button class="btn btn-sm btn-danger cancel-iv-btn" data-id="${iv._id}" title="Cancel"><i data-lucide="x"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    lucide.createIcons();

    /* countdown timers */
    ivs.filter(iv => iv.scheduledAt && new Date(iv.scheduledAt) > new Date()).forEach(iv => {
      const el = document.getElementById(`cd-${iv._id}`);
      if (!el) return;
      const t = setInterval(() => {
        const diff = new Date(iv.scheduledAt) - Date.now();
        if (diff <= 0) { clearInterval(t); el.textContent = 'Starting now'; return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = h > 0 ? `in ${h}h ${m}m` : m > 0 ? `in ${m}m ${s}s` : `in ${s}s`;
      }, 1000);
      _countdownTimers.push(t);
    });

    document.querySelectorAll('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.link).then(() => window.showToast('Link copied!', 'success'));
      });
    });

    document.querySelectorAll('.edit-iv-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const iv = _interviews.find(i => i._id === btn.dataset.id);
        if (!iv) return;
        await _fetchShortlisted();
        _openScheduleModal(iv);
      });
    });

    document.querySelectorAll('.cancel-iv-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Cancel this interview?')) return;
        try {
          await window.API.put(`/interviews/${btn.dataset.id}`, { status: 'cancelled' });
          window.showToast('Interview cancelled', 'success');
          _loadInterviews();
        } catch (err) { window.showToast(err.message, 'error'); }
      });
    });
  }

  function _openScheduleModal(iv) {
    _editingId = iv?._id || null;
    const isEdit = !!_editingId;
    const appOptions = _shortlistedApps.map(a =>
      `<option value="${a._id}" ${iv?.applicationId?._id === a._id || iv?.applicationId === a._id ? 'selected' : ''}>${a.name||a.applicantName} — ${a.college||''}</option>`
    ).join('');

    const scheduledDate = iv?.scheduledAt ? new Date(iv.scheduledAt).toISOString().slice(0,10) : '';
    const scheduledTime = iv?.scheduledAt ? new Date(iv.scheduledAt).toTimeString().slice(0,5) : '';

    const body = `
      <div class="form-section">
        ${!isEdit ? `<div class="form-group">
          <label>Candidate (Shortlisted Application) *</label>
          <select id="iv-app" class="form-control">
            <option value="">Select candidate…</option>
            ${appOptions}
          </select>
        </div>` : `<div class="form-group">
          <label>Candidate</label>
          <input class="form-control" value="${iv?.applicationId?.name||iv?.candidateName||''}" disabled>
        </div>`}
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" id="iv-date" class="form-control" value="${scheduledDate}">
          </div>
          <div class="form-group">
            <label>Time *</label>
            <input type="time" id="iv-time" class="form-control" value="${scheduledTime}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Mode *</label>
            <select id="iv-mode" class="form-control">
              <option value="zoom" ${iv?.mode==='zoom'?'selected':''}>Zoom</option>
              <option value="google_meet" ${iv?.mode==='google_meet'?'selected':''}>Google Meet</option>
              <option value="offline" ${iv?.mode==='offline'?'selected':''}>Offline</option>
              <option value="phone" ${iv?.mode==='phone'?'selected':''}>Phone</option>
            </select>
          </div>
          <div class="form-group">
            <label>Interviewer Name</label>
            <input type="text" id="iv-interviewer" class="form-control" value="${iv?.interviewer||''}" placeholder="Name of interviewer">
          </div>
        </div>
        <div class="form-group" id="meet-link-group" style="${(!iv?.mode || iv?.mode==='zoom' || iv?.mode==='google_meet') ? '' : 'display:none'}">
          <label>Meet Link</label>
          <input type="url" id="iv-link" class="form-control" value="${iv?.meetLink||''}" placeholder="https://meet.google.com/…">
        </div>
        ${isEdit ? `
        <hr style="border-color:rgba(255,255,255,0.08);margin:1rem 0">
        <h4 style="color:var(--text-primary);margin-bottom:.75rem">Interview Result (after completion)</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select id="iv-status" class="form-control">
              <option value="scheduled" ${iv?.status==='scheduled'?'selected':''}>Scheduled</option>
              <option value="completed" ${iv?.status==='completed'?'selected':''}>Completed</option>
              <option value="cancelled" ${iv?.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label>Result</label>
            <select id="iv-result" class="form-control">
              <option value="" ${!iv?.result?'selected':''}>—</option>
              <option value="pass" ${iv?.result==='pass'?'selected':''}>Pass</option>
              <option value="fail" ${iv?.result==='fail'?'selected':''}>Fail</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Score (1-10): <span id="score-val">${iv?.score??5}</span></label>
          <input type="range" id="iv-score" min="1" max="10" step="1" value="${iv?.score??5}" class="form-control"
            oninput="document.getElementById('score-val').textContent=this.value" style="padding:.2rem 0">
        </div>
        <div class="form-group">
          <label>Feedback / Notes</label>
          <textarea id="iv-feedback" class="form-control" rows="3" placeholder="Interview feedback…">${iv?.feedback||''}</textarea>
        </div>` : ''}
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-iv-btn">${isEdit ? 'Update Interview' : 'Schedule Interview'}</button>`;

    window.showModal(isEdit ? 'Update Interview' : 'Schedule Interview', body, footer);
    lucide.createIcons();

    document.getElementById('iv-mode')?.addEventListener('change', e => {
      const needsLink = ['zoom','google_meet'].includes(e.target.value);
      document.getElementById('meet-link-group').style.display = needsLink ? '' : 'none';
    });

    document.getElementById('save-iv-btn')?.addEventListener('click', _saveInterview);
  }

  async function _saveInterview() {
    const isEdit = !!_editingId;
    const date = document.getElementById('iv-date')?.value;
    const time = document.getElementById('iv-time')?.value;
    const mode = document.getElementById('iv-mode')?.value;
    const interviewer = document.getElementById('iv-interviewer')?.value.trim();
    const meetLink = document.getElementById('iv-link')?.value.trim();

    if (!date || !time || !mode) {
      window.showToast('Date, time and mode are required', 'error');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const payload = { scheduledAt, mode, interviewer, meetLink };

    if (!isEdit) {
      const appId = document.getElementById('iv-app')?.value;
      if (!appId) { window.showToast('Please select a candidate', 'error'); return; }
      payload.applicationId = appId;
    } else {
      payload.status = document.getElementById('iv-status')?.value;
      payload.result = document.getElementById('iv-result')?.value;
      payload.score = parseInt(document.getElementById('iv-score')?.value) || undefined;
      payload.feedback = document.getElementById('iv-feedback')?.value.trim();
    }

    const btn = document.getElementById('save-iv-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    try {
      if (isEdit) {
        await window.API.put(`/interviews/${_editingId}`, payload);
        window.showToast('Interview updated successfully', 'success');
      } else {
        await window.API.post('/interviews', payload);
        window.showToast('Interview scheduled successfully', 'success');
      }
      window.closeModal();
      _loadInterviews();
    } catch (err) {
      window.showToast(err.message || 'Failed to save interview', 'error');
      btn.disabled = false;
      btn.textContent = isEdit ? 'Update Interview' : 'Schedule Interview';
    }
  }

  return { render };
})();
