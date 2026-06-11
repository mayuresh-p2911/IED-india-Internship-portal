// ═══════════════════════════════════════════════════════════
// IED India IMS — Certificates Module
// ═══════════════════════════════════════════════════════════

window.CertificatesModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    content.innerHTML = renderLoading();
    try {
      const data = await API.get('/certificates');
      const certs = data.certificates || [];
      const canGenerate = Auth.is('admin', 'hr');

      content.innerHTML = `
        <div class="page-header">
          <div><h2>Certificates</h2><p>${canGenerate ? 'Generate and manage internship certificates' : 'Your earned certificates'}</p></div>
          ${canGenerate ? `<button class="btn btn-primary" onclick="CertificatesModule.showGenerateModal()"><i data-lucide="plus"></i> Generate Certificate</button>` : ''}
        </div>

        ${certs.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
            ${certs.map(c => CertificatesModule._renderCertCard(c)).join('')}
          </div>` : `
          <div class="empty-state" style="padding:60px">
            <div class="empty-icon"><i data-lucide="award" style="width:48px;height:48px;color:var(--text-muted)"></i></div>
            <h3>No Certificates Yet</h3>
            <p>${Auth.is('intern') ? 'Complete your internship to earn a certificate!' : 'Generate certificates for completed interns'}</p>
            ${canGenerate ? `<button class="btn btn-primary" style="margin-top:16px" onclick="CertificatesModule.showGenerateModal()"><i data-lucide="award"></i> Generate First Certificate</button>` : ''}
          </div>`}`;

      lucide.createIcons();
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load certificates: ${err.message}</div>`; }
  },

  _renderCertCard: (c) => `
    <div class="cert-card" style="padding:20px;background:linear-gradient(135deg,rgba(26,35,126,0.5) 0%,rgba(13,71,161,0.4) 100%);border:1px solid rgba(79,142,247,0.3);border-radius:16px;position:relative;overflow:hidden">
      <div style="position:absolute;top:16px;right:16px;font-size:2rem;opacity:0.2"><i data-lucide="award" style="width:32px;height:32px;color:var(--accent-gold)"></i></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--grad-gold);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
          <i data-lucide="${c.type==='completion'?'graduation-cap':c.type==='recommendation'?'star':'hand-heart'}" style="width:22px;height:22px;color:#fff"></i>
        </div>
        <div>
          <div style="font-weight:700;font-size:0.95rem;color:var(--accent-gold)">${c.type.charAt(0).toUpperCase()+c.type.slice(1)} Certificate</div>
          <div style="font-size:0.7rem;color:var(--text-muted);font-family:monospace">${c.certNo||''}</div>
        </div>
      </div>
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:4px">${c.internId?.name||'-'}</div>
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px">${c.internId?.department||''}</div>
      ${c.performance ? `<div style="margin-bottom:8px">${statusBadge(c.performance)}</div>` : ''}
      ${c.validFrom && c.validTo ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px">${formatDate(c.validFrom)} - ${formatDate(c.validTo)}</div>` : ''}
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:16px">Issued: ${formatDate(c.issuedDate)}</div>
      <button class="btn btn-primary btn-full" onclick="CertificatesModule.download('${c._id}','${c.internId?.name||'intern'}','${c.type}')">
        <i data-lucide="download"></i> Download PDF
      </button>
    </div>`,

  download: (id, name, type) => {
    showToast('Preparing certificate PDF...', 'info');
    const link = document.createElement('a');
    link.href = `/api/certificates/${id}/download`;
    link.setAttribute('download', `${name}_${type}_certificate.pdf`);
    link.click();
  },

  showGenerateModal: async () => {
    try {
      const internsData = await API.get('/users?role=intern');
      const interns = internsData.users || [];
      const today = new Date().toISOString().split('T')[0];

      showModal('Generate Certificate', `
        <form id="cert-form" style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label>Intern *</label>
            <select name="internId" required>
              <option value="">Select intern</option>
              ${interns.map(i=>`<option value="${i._id}">${i.name} (${i.department||''})</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Certificate Type *</label>
              <select name="type" required>
                <option value="completion">Completion Certificate</option>
                <option value="recommendation">Letter of Recommendation</option>
                <option value="appreciation">Appreciation Certificate</option>
              </select>
            </div>
            <div class="form-group">
              <label>Performance</label>
              <select name="performance">
                <option value="excellent">Excellent</option>
                <option value="good" selected>Good</option>
                <option value="average">Average</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Valid From</label><input type="date" name="validFrom" value="${today}" /></div>
            <div class="form-group"><label>Valid To</label><input type="date" name="validTo" /></div>
          </div>
          <div style="background:rgba(79,142,247,0.08);border:1px solid rgba(79,142,247,0.2);border-radius:8px;padding:12px;font-size:0.82rem;color:var(--text-secondary)">
            <i data-lucide="info" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>
            A PDF certificate with QR code verification will be generated and saved.
          </div>
        </form>`,
        `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
         <button class="btn btn-primary" onclick="CertificatesModule.generate()"><i data-lucide="award"></i> Generate Certificate</button>`
      );
    } catch(err) { showToast(err.message, 'error'); }
  },

  generate: async () => {
    const form = document.getElementById('cert-form');
    if (!form?.checkValidity()) { form?.reportValidity(); return; }
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    const btn = document.querySelector('#modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Generating...'; }
    try {
      await API.post('/certificates/generate', body);
      showToast('Certificate generated successfully!', 'success');
      closeModal();
      CertificatesModule.render();
    } catch(err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="award"></i> Generate Certificate'; lucide.createIcons(); }
    }
  }
};
