// ═══════════════════════════════════════════════════════════
// IED India IMS — Evaluation Module
// ═══════════════════════════════════════════════════════════

let evalChart = null;

window.EvaluationModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    content.innerHTML = renderLoading();
    try {
      if (Auth.is('intern')) {
        await EvaluationModule._renderInternView(content);
      } else {
        await EvaluationModule._renderMentorView(content);
      }
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load evaluations: ${err.message}</div>`; }
  },

  _renderMentorView: async (content) => {
    const [evalsData, internsData] = await Promise.all([
      API.get('/evaluations'),
      API.get('/users?role=intern')
    ]);
    const evals = evalsData.evaluations || [];
    const interns = internsData.users || [];

    content.innerHTML = `
      <div class="page-header">
        <div><h2>Performance Evaluations</h2><p>Weekly intern performance reviews and KPI tracking</p></div>
        <button class="btn btn-primary" onclick="EvaluationModule.showCreateModal()"><i data-lucide="plus"></i> New Evaluation</button>
      </div>

      <div class="filter-bar glass-card" style="padding:16px;margin-bottom:20px">
        <select id="eval-intern-filter" style="width:220px" onchange="EvaluationModule.loadProgress()">
          <option value="">All Interns</option>
          ${interns.map(i=>`<option value="${i._id}">${i.name}</option>`).join('')}
        </select>
      </div>

      <div class="dashboard-grid-2" style="margin-bottom:24px">
        <div class="glass-card" style="padding:20px">
          <h4 style="margin-bottom:16px"><i data-lucide="radar"></i> Performance Radar</h4>
          <div style="height:280px;display:flex;align-items:center;justify-content:center">
            <canvas id="eval-radar"></canvas>
          </div>
          <p id="radar-hint" style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:8px">Select an intern above to view their radar chart</p>
        </div>
        <div class="glass-card" style="padding:20px">
          <h4 style="margin-bottom:16px"><i data-lucide="trending-up"></i> Score Trend</h4>
          <div style="height:280px"><canvas id="eval-trend"></canvas></div>
        </div>
      </div>

      <div class="table-container glass-card">
        <table>
          <thead><tr><th>Intern</th><th>Week</th><th>Comm</th><th>Team</th><th>Lead</th><th>Disc</th><th>Tech</th><th>Task</th><th>Overall</th><th>Rec.</th><th>Date</th></tr></thead>
          <tbody>
            ${evals.length ? evals.map(e=>`<tr>
              <td><strong>${e.internId?.name||'-'}</strong></td>
              <td>Week ${e.week}</td>
              <td>${e.ratings?.communication||'-'}</td>
              <td>${e.ratings?.teamwork||'-'}</td>
              <td>${e.ratings?.leadership||'-'}</td>
              <td>${e.ratings?.discipline||'-'}</td>
              <td>${e.ratings?.technical||'-'}</td>
              <td>${e.ratings?.taskCompletion||'-'}</td>
              <td><strong style="color:var(--accent-blue)">${e.overallScore||'-'}</strong></td>
              <td>${statusBadge(e.recommendation||'good')}</td>
              <td>${formatDate(e.createdAt)}</td>
            </tr>`).join('')
            : `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)">No evaluations yet</td></tr>`}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons();
    EvaluationModule._renderEmptyCharts();
  },

  _renderInternView: async (content) => {
    const me = Auth.user._id;
    const [evalsData, progressData] = await Promise.all([
      API.get('/evaluations'),
      API.get(`/evaluations/progress/${me}`)
    ]);
    const evals = evalsData.evaluations || [];
    const progress = progressData.progress || {};
    const avg = progress.averages || {};
    const overall = progress.overallAverage || 0;

    content.innerHTML = `
      <div class="page-header">
        <div><h2>My Evaluations</h2><p>View your performance reviews and progress</p></div>
      </div>

      <div class="dashboard-grid-2" style="margin-bottom:24px">
        <div class="glass-card" style="padding:20px;text-align:center">
          <h4 style="margin-bottom:20px">Overall Performance</h4>
          <div style="display:inline-flex;flex-direction:column;align-items:center;gap:12px">
            <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(var(--accent-blue) ${overall*36}deg, var(--border-color) 0deg);display:flex;align-items:center;justify-content:center;position:relative">
              <div style="width:90px;height:90px;border-radius:50%;background:var(--bg-secondary);display:flex;flex-direction:column;align-items:center;justify-content:center">
                <span style="font-size:1.8rem;font-weight:800;color:var(--accent-blue)">${overall}</span>
                <span style="font-size:0.7rem;color:var(--text-muted)">/10</span>
              </div>
            </div>
            <p style="color:var(--text-secondary)">Average Score across ${evals.length} evaluation(s)</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
            ${Object.entries(avg).map(([k,v])=>`
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px">
                  <span style="text-transform:capitalize">${k.replace(/([A-Z])/g,' $1')}</span>
                  <strong style="color:var(--accent-blue)">${v}</strong>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${v*10}%"></div></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="glass-card" style="padding:20px">
          <h4 style="margin-bottom:16px">Performance Radar</h4>
          <div style="height:280px"><canvas id="intern-radar"></canvas></div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        ${evals.length ? evals.map(e=>`
          <div class="glass-card" style="padding:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <h4>Week ${e.week} — ${e.period||''}</h4>
              <div style="display:flex;align-items:center;gap:12px">
                ${statusBadge(e.recommendation||'good')}
                <div style="width:48px;height:48px;border-radius:50%;background:conic-gradient(var(--accent-blue) ${e.overallScore*36}deg,var(--border-color) 0);display:flex;align-items:center;justify-content:center">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.85rem;color:var(--accent-blue)">${e.overallScore}</div>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
              ${Object.entries(e.ratings||{}).map(([k,v])=>`
                <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:8px;text-align:center">
                  <div style="font-size:1.1rem;font-weight:700;color:var(--accent-blue)">${v}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);text-transform:capitalize">${k.replace(/([A-Z])/g,' $1')}</div>
                </div>`).join('')}
            </div>
            ${e.comments ? `<p style="color:var(--text-secondary);font-size:0.875rem;border-top:1px solid var(--border-color);padding-top:12px">💬 ${e.comments}</p>` : ''}
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px">By ${e.mentorId?.name||'Mentor'} · ${formatDate(e.createdAt)}</p>
          </div>`).join('')
        : `<div class="empty-state"><div class="empty-icon">⭐</div><h3>No evaluations yet</h3><p>Your mentor will evaluate your performance weekly</p></div>`}
      </div>`;
    lucide.createIcons();

    // Intern radar chart
    if (Object.keys(avg).length) {
      if (evalChart) { evalChart.destroy(); }
      evalChart = new Chart(document.getElementById('intern-radar'), {
        type: 'radar',
        data: {
          labels: ['Communication','Teamwork','Leadership','Discipline','Technical','Task Completion'],
          datasets: [{ label:'Avg Score', data: [avg.communication,avg.teamwork,avg.leadership,avg.discipline,avg.technical,avg.taskCompletion], borderColor:'#4f8ef7', backgroundColor:'rgba(79,142,247,0.2)', pointBackgroundColor:'#4f8ef7' }]
        },
        options: { responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0, max:10, ticks:{stepSize:2}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'#94a3b8',font:{size:11}} } }, plugins:{legend:{display:false}} }
      });
    }
  },

  loadProgress: async () => {
    const internId = document.getElementById('eval-intern-filter')?.value;
    if (!internId) { EvaluationModule._renderEmptyCharts(); return; }
    try {
      const data = await API.get(`/evaluations/progress/${internId}`);
      const progress = data.progress || {};
      const avg = progress.averages || {};
      const weeks = progress.weeks || [];

      if (evalChart) evalChart.destroy();
      const radarCanvas = document.getElementById('eval-radar');
      if (radarCanvas && Object.keys(avg).length) {
        evalChart = new Chart(radarCanvas, {
          type: 'radar',
          data: {
            labels: ['Communication','Teamwork','Leadership','Discipline','Technical','Task Completion'],
            datasets: [{ label:'Avg Score', data: Object.values(avg), borderColor:'#4f8ef7', backgroundColor:'rgba(79,142,247,0.2)', pointBackgroundColor:'#4f8ef7' }]
          },
          options: { responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0, max:10, ticks:{stepSize:2}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'#94a3b8'} } }, plugins:{legend:{display:false}} }
        });
        document.getElementById('radar-hint').textContent = '';
      }

      const trendCanvas = document.getElementById('eval-trend');
      if (trendCanvas && weeks.length) {
        if (window._trendChart) window._trendChart.destroy();
        window._trendChart = new Chart(trendCanvas, {
          type: 'line',
          data: {
            labels: weeks.map(w=>`Week ${w.week}`),
            datasets: [{ label:'Overall', data: weeks.map(w=>w.overall), borderColor:'#4f8ef7', backgroundColor:'rgba(79,142,247,0.15)', fill:true, tension:0.4, pointBackgroundColor:'#4f8ef7' }]
          },
          options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ min:0, max:10 } }, plugins:{legend:{display:false}} }
        });
      }
    } catch(err) { showToast(err.message, 'error'); }
  },

  _renderEmptyCharts: () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
    const r = document.getElementById('eval-radar');
    const t = document.getElementById('eval-trend');
    if (r && !evalChart) {
      evalChart = new Chart(r, { type:'radar', data:{ labels:['Communication','Teamwork','Leadership','Discipline','Technical','Task Completion'], datasets:[{ data:[0,0,0,0,0,0], borderColor:'rgba(79,142,247,0.3)', backgroundColor:'rgba(79,142,247,0.05)' }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0, max:10, ticks:{stepSize:2}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'#94a3b8'} } }, plugins:{legend:{display:false}} } });
    }
  },

  showCreateModal: async () => {
    const internsData = await API.get('/users?role=intern');
    const interns = internsData.users || [];
    const PARAMS = ['communication','teamwork','leadership','discipline','technical','taskCompletion'];
    const LABELS = { communication:'Communication', teamwork:'Teamwork', leadership:'Leadership', discipline:'Discipline', technical:'Technical Skills', taskCompletion:'Task Completion' };

    showModal('New Performance Evaluation', `
      <form id="eval-form" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-row">
          <div class="form-group"><label>Intern *</label>
            <select name="internId" required>
              <option value="">Select intern</option>
              ${interns.map(i=>`<option value="${i._id}">${i.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Week Number *</label><input type="number" name="week" required min="1" max="52" placeholder="e.g. 1" /></div>
        </div>
        <div class="form-group"><label>Period</label><input type="text" name="period" placeholder="e.g. Week 1: Jun 1-7" /></div>
        <hr style="border-color:var(--border-color)">
        <h4 style="color:var(--text-secondary)">Performance Ratings (1-10)</h4>
        ${PARAMS.map(p=>`
          <div class="eval-param">
            <div class="eval-param-header">
              <span class="eval-param-label">${LABELS[p]}</span>
              <span class="eval-param-score" id="score-${p}">5</span>
            </div>
            <input type="range" name="ratings.${p}" min="1" max="10" value="5"
              oninput="document.getElementById('score-${p}').textContent=this.value;EvaluationModule.calcOverall()"
              style="width:100%" />
          </div>`).join('')}
        <div style="text-align:center;padding:12px;background:rgba(79,142,247,0.1);border-radius:8px;border:1px solid rgba(79,142,247,0.2)">
          Overall Score: <strong id="overall-score" style="font-size:1.3rem;color:var(--accent-blue)">5.0</strong>/10
        </div>
        <div class="form-group"><label>Comments</label><textarea name="comments" rows="3" placeholder="General feedback..."></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Strengths</label><textarea name="strengths" rows="2" placeholder="Key strengths..."></textarea></div>
          <div class="form-group"><label>Areas for Improvement</label><textarea name="improvements" rows="2" placeholder="What to improve..."></textarea></div>
        </div>
        <div class="form-group"><label>Recommendation</label>
          <select name="recommendation">
            <option value="excellent">Excellent</option><option value="good" selected>Good</option>
            <option value="average">Average</option><option value="needs_improvement">Needs Improvement</option>
          </select>
        </div>
      </form>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="EvaluationModule.submitEval()"><i data-lucide="star"></i> Submit Evaluation</button>`
    );
  },

  calcOverall: () => {
    const PARAMS = ['communication','teamwork','leadership','discipline','technical','taskCompletion'];
    const vals = PARAMS.map(p => parseFloat(document.querySelector(`[name="ratings.${p}"]`)?.value||5));
    const avg = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    const el = document.getElementById('overall-score');
    if (el) el.textContent = avg;
  },

  submitEval: async () => {
    const form = document.getElementById('eval-form');
    if (!form?.checkValidity()) { form?.reportValidity(); return; }
    const fd = new FormData(form);
    const body = { internId: fd.get('internId'), week: fd.get('week'), period: fd.get('period'), comments: fd.get('comments'), strengths: fd.get('strengths'), improvements: fd.get('improvements'), recommendation: fd.get('recommendation'), ratings: {} };
    const PARAMS = ['communication','teamwork','leadership','discipline','technical','taskCompletion'];
    PARAMS.forEach(p => { body.ratings[p] = parseFloat(fd.get(`ratings.${p}`)); });
    try {
      await API.post('/evaluations', body);
      showToast('Evaluation submitted!', 'success');
      closeModal();
      EvaluationModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  }
};
