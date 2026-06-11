/* ==========================================================
   onboarding.js  –  IED India Internship Management System
   ========================================================== */

window.OnboardingModule = (() => {
  let _records = [];

  async function render() {
    const role = window.Auth?.user?.role;
    if (role === 'intern') {
      await _renderInternView();
    } else {
      await _renderAdminView();
    }
  }

  /* ── Admin / HR view ── */
  async function _renderAdminView() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Onboarding</h1>
      </div>
      <div id="ob-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>`;
    lucide.createIcons();

    try {
      const res = await window.API.get('/onboarding');
      _records = res.onboarding || res || [];
      _renderAdminList();
    } catch (err) {
      document.getElementById('ob-list').innerHTML =
        `<div class="empty-state"><i data-lucide="alert-circle"></i><p>Failed to load: ${err.message}</p></div>`;
      lucide.createIcons();
    }
  }

  function _progressPercent(ob) {
    const checks = ['offerLetterSent','agreementUploaded','internIdGenerated','orientationDone','welcomeEmailSent'];
    const done = checks.filter(k => ob[k]).length;
    return Math.round((done / checks.length) * 100);
  }

  function _renderAdminList() {
    const el = document.getElementById('ob-list');
    if (!_records.length) {
      el.innerHTML = `<div class="empty-state"><i data-lucide="users"></i><p>No onboarding records found</p></div>`;
      lucide.createIcons();
      return;
    }

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem">
        ${_records.map(ob => {
          const pct = _progressPercent(ob);
          const color = pct === 100 ? '#00e676' : pct >= 50 ? '#ffd700' : '#ff9100';
          const intern = ob.internId || {};
          return `
          <div class="glass-card" style="padding:1.25rem">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#4f8ef7,#7c4dff);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${(intern.name||'?')[0].toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--text-primary)">${intern.name||'Unknown'}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">${intern.department||''}</div>
              </div>
              <div style="font-weight:700;font-size:1.1rem;color:${color}">${pct}%</div>
            </div>
            <div class="progress-bar" style="margin-bottom:.5rem">
              <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
              ${ob.offerLetterSent ? '<span class="status-badge status-active" style="font-size:.65rem">Offer Sent</span>' : ''}
              ${ob.agreementUploaded ? '<span class="status-badge status-active" style="font-size:.65rem">Agreement</span>' : ''}
              ${ob.internIdGenerated ? '<span class="status-badge status-active" style="font-size:.65rem">ID Generated</span>' : ''}
              ${ob.orientationDone ? '<span class="status-badge status-active" style="font-size:.65rem">Orientation</span>' : ''}
              ${ob.welcomeEmailSent ? '<span class="status-badge status-active" style="font-size:.65rem">Welcome Email</span>' : ''}
            </div>
            <button class="btn btn-sm btn-primary open-ob-btn" data-id="${ob._id}" style="width:100%">
              <i data-lucide="edit-3"></i> Manage Checklist
            </button>
          </div>`;
        }).join('')}
      </div>`;
    lucide.createIcons();

    document.querySelectorAll('.open-ob-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ob = _records.find(r => r._id === btn.dataset.id);
        if (ob) _openChecklistModal(ob);
      });
    });
  }

  function _openChecklistModal(ob) {
    const orientDate = ob.orientationDate ? new Date(ob.orientationDate).toISOString().slice(0,10) : '';
    const docs = ob.documents || {};

    const body = `
      <div class="form-section">
        <h4 style="color:var(--text-primary);margin-bottom:.75rem">Checklist Items</h4>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${[
            ['offerLetterSent','Offer Letter Sent'],
            ['agreementUploaded','Agreement Uploaded'],
            ['internIdGenerated','Intern ID Generated'],
            ['orientationDone','Orientation Done'],
            ['welcomeEmailSent','Welcome Email Sent'],
          ].map(([k, label]) => `
            <label style="display:flex;align-items:center;justify-content:space-between;padding:.6rem 1rem;background:rgba(255,255,255,0.04);border-radius:8px;cursor:pointer">
              <span style="color:var(--text-secondary)">${label}</span>
              <div class="toggle-wrap" style="position:relative;width:44px;height:22px">
                <input type="checkbox" id="chk-${k}" ${ob[k] ? 'checked' : ''} style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;z-index:2;margin:0">
                <div class="toggle-track" style="position:absolute;inset:0;border-radius:11px;background:${ob[k]?'#00e676':'rgba(255,255,255,0.12)'};transition:background .2s"></div>
                <div style="position:absolute;top:2px;left:${ob[k]?'22':'2'}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s"></div>
              </div>
            </label>`).join('')}
        </div>

        <h4 style="color:var(--text-primary);margin:.75rem 0">Document Upload Status</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          ${[['resume','Resume'],['aadhaar','Aadhaar'],['collegeId','College ID'],['photo','Photo']].map(([k,label]) => `
            <div style="padding:.6rem;background:rgba(255,255,255,0.04);border-radius:8px">
              <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.3rem">${label}</div>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="color:${docs[k]?'#00e676':'#ff9100'};font-size:.8rem">${docs[k]?'✓ Uploaded':'✗ Missing'}</span>
                <button class="btn btn-sm btn-ghost" title="Mark uploaded" onclick="
                  this.parentElement.querySelector('span').textContent='✓ Uploaded';
                  this.parentElement.querySelector('span').style.color='#00e676';
                  document.getElementById('doc-${k}').value='uploaded';
                "><i data-lucide="upload"></i></button>
              </div>
              <input type="hidden" id="doc-${k}" value="${docs[k]||''}">
            </div>`).join('')}
        </div>

        <div class="form-row" style="margin-top:.75rem">
          <div class="form-group">
            <label>Orientation Date</label>
            <input type="date" id="ob-orient-date" class="form-control" value="${orientDate}">
          </div>
          <div class="form-group">
            <label>Intern ID</label>
            <input type="text" id="ob-intern-id" class="form-control" value="${ob.internId?.internshipId||ob.internshipId||''}" placeholder="IED-2024-001">
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="ob-notes" class="form-control" rows="3" placeholder="Additional notes…">${ob.notes||''}</textarea>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-ob-btn">Save Checklist</button>`;

    window.showModal(`Onboarding: ${ob.internId?.name || 'Intern'}`, body, footer);
    lucide.createIcons();

    /* animate toggles */
    document.querySelectorAll('.toggle-wrap input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const track = cb.nextElementSibling;
        const thumb = track.nextElementSibling;
        track.style.background = cb.checked ? '#00e676' : 'rgba(255,255,255,0.12)';
        thumb.style.left = cb.checked ? '22px' : '2px';
      });
    });

    document.getElementById('save-ob-btn')?.addEventListener('click', () => _saveChecklist(ob._id));
  }

  async function _saveChecklist(id) {
    const payload = {
      offerLetterSent: document.getElementById('chk-offerLetterSent')?.checked,
      agreementUploaded: document.getElementById('chk-agreementUploaded')?.checked,
      internIdGenerated: document.getElementById('chk-internIdGenerated')?.checked,
      orientationDone: document.getElementById('chk-orientationDone')?.checked,
      welcomeEmailSent: document.getElementById('chk-welcomeEmailSent')?.checked,
      orientationDate: document.getElementById('ob-orient-date')?.value || undefined,
      notes: document.getElementById('ob-notes')?.value.trim(),
      documents: {
        resume: document.getElementById('doc-resume')?.value,
        aadhaar: document.getElementById('doc-aadhaar')?.value,
        collegeId: document.getElementById('doc-collegeId')?.value,
        photo: document.getElementById('doc-photo')?.value,
      },
    };
    const internIdVal = document.getElementById('ob-intern-id')?.value.trim();
    if (internIdVal) payload.internshipId = internIdVal;

    const btn = document.getElementById('save-ob-btn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await window.API.put(`/onboarding/${id}`, payload);
      window.showToast('Onboarding checklist saved!', 'success');
      window.closeModal();
      _renderAdminView();
    } catch (err) {
      window.showToast(err.message || 'Failed to save', 'error');
      btn.disabled = false; btn.textContent = 'Save Checklist';
    }
  }

  /* ── Intern view ── */
  async function _renderInternView() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">My Onboarding</h1>
      </div>
      <div id="intern-ob-content">
        <div class="loading"><div class="spinner"></div></div>
      </div>`;
    lucide.createIcons();

    try {
      const ob = await window.API.get('/onboarding/me');
      _renderInternChecklist(ob);
    } catch (err) {
      document.getElementById('intern-ob-content').innerHTML =
        `<div class="empty-state"><i data-lucide="clipboard"></i><p>No onboarding record found. Please contact HR.</p></div>`;
      lucide.createIcons();
    }
  }

  function _renderInternChecklist(ob) {
    const pct = _progressPercent(ob);
    const circumference = 251.2;
    const offset = circumference - (pct / 100) * circumference;
    const docs = ob.documents || {};
    const items = [
      ['offerLetterSent','Offer Letter Sent','file-check'],
      ['agreementUploaded','Agreement Uploaded','file-signature'],
      ['internIdGenerated','Intern ID Generated','id-card'],
      ['orientationDone','Orientation Done','users'],
      ['welcomeEmailSent','Welcome Email Sent','mail'],
    ];

    document.getElementById('intern-ob-content').innerHTML = `
      <div class="form-row" style="gap:1.5rem;align-items:flex-start">
        <!-- progress ring -->
        <div class="glass-card" style="flex:1;padding:2rem;display:flex;flex-direction:column;align-items:center">
          <div style="position:relative;width:140px;height:140px;margin-bottom:1.5rem">
            <svg width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg)">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="12"/>
              <circle cx="70" cy="70" r="60" fill="none" stroke="${pct===100?'#00e676':'#4f8ef7'}" stroke-width="12"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset .6s"/>
            </svg>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
              <div style="font-size:1.8rem;font-weight:800;color:var(--text-primary)">${pct}%</div>
              <div style="font-size:.7rem;color:var(--text-muted)">complete</div>
            </div>
          </div>
          ${ob.internshipId || ob.internId?.internshipId ? `
          <div style="background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.3);border-radius:8px;padding:.75rem 1.5rem;text-align:center">
            <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.2rem">Your Intern ID</div>
            <div style="font-size:1.2rem;font-weight:700;color:#4f8ef7;letter-spacing:.1em">${ob.internshipId||ob.internId?.internshipId}</div>
          </div>` : ''}
        </div>

        <!-- checklist -->
        <div class="glass-card" style="flex:2;padding:1.5rem">
          <h3 style="color:var(--text-primary);margin-bottom:1rem">Onboarding Checklist</h3>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${items.map(([k, label, icon]) => `
              <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${ob[k]?'#00e676':'rgba(255,255,255,0.1)'}">
                <div style="color:${ob[k]?'#00e676':'var(--text-muted)'}"><i data-lucide="${ob[k]?'check-circle':icon}"></i></div>
                <span style="color:${ob[k]?'var(--text-primary)':'var(--text-muted)'};">${label}</span>
                <span style="margin-left:auto;font-size:.75rem;color:${ob[k]?'#00e676':'var(--text-muted)'}">${ob[k]?'Done':'Pending'}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- document uploads -->
      <div class="glass-card" style="padding:1.5rem;margin-top:1.5rem">
        <h3 style="color:var(--text-primary);margin-bottom:1rem">Document Uploads</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem">
          ${[['resume','Resume','file-text'],['aadhaar','Aadhaar Card','credit-card'],['collegeId','College ID','id-card'],['photo','Profile Photo','camera']].map(([k,label,icon]) => `
            <div style="padding:1rem;background:rgba(255,255,255,0.04);border-radius:8px;text-align:center">
              <i data-lucide="${icon}" style="color:${docs[k]?'#00e676':'var(--text-muted)'};margin-bottom:.5rem;width:32px;height:32px"></i>
              <div style="font-weight:500;color:var(--text-primary);margin-bottom:.25rem">${label}</div>
              <div style="font-size:.75rem;color:${docs[k]?'#00e676':'#ff9100'};margin-bottom:.75rem">${docs[k]?'✓ Uploaded':'Not uploaded'}</div>
              <label class="btn btn-sm ${docs[k]?'btn-secondary':'btn-primary'}" style="cursor:pointer">
                <i data-lucide="${docs[k]?'refresh-cw':'upload'}"></i> ${docs[k]?'Replace':'Upload'}
                <input type="file" style="display:none" onchange="window.OnboardingModule._uploadDoc('${k}', this)">
              </label>
            </div>`).join('')}
        </div>
      </div>

      ${ob.notes ? `
      <div class="glass-card" style="padding:1.5rem;margin-top:1.5rem">
        <h3 style="color:var(--text-primary);margin-bottom:.75rem">Notes from HR</h3>
        <p style="color:var(--text-secondary);line-height:1.6;margin:0">${ob.notes}</p>
      </div>` : ''}`;

    lucide.createIcons();
  }

  async function _uploadDoc(type, input) {
    const file = input?.files?.[0];
    if (!file) return;
    window.showToast(`Uploading ${type}…`, 'info');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);
      await window.API.post('/onboarding/upload', formData);
      window.showToast('Document uploaded successfully!', 'success');
      _renderInternView();
    } catch (err) {
      window.showToast(err.message || 'Upload failed', 'error');
    }
  }

  return { render, _uploadDoc };
})();
