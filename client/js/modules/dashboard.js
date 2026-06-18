// ═══════════════════════════════════════════════════════════
// IED India IMS — Dashboard Module
// ═══════════════════════════════════════════════════════════

let dashCharts = {};

window.DashboardModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    const role = Auth.user?.role;

    if (role === 'admin' || role === 'hr') {
      await DashboardModule._renderAdminHR(content);
    } else if (role === 'mentor') {
      await DashboardModule._renderMentor(content);
    } else {
      await DashboardModule._renderIntern(content);
    }
  },

  _renderAdminHR: async (content) => {
    try {
      const [statsData, appsData, interviewsData] = await Promise.all([
        API.get('/analytics/summary'),
        API.get('/applications?limit=12').catch(() => ({ applications: [] })),
        API.get('/interviews').catch(() => ({ interviews: [] }))
      ]);
      const s = statsData.stats || {};
      const charts = statsData.charts || {};
      const apps = appsData.applications || [];
      const interviews = interviewsData.interviews || [];

      const firstName = (Auth.user.name || 'there').split(' ')[0];
      const now = Date.now();
      const upcoming = interviews
        .filter(i => { const t = new Date(i.scheduledAt || i.scheduledDate).getTime(); return t && t >= now && i.status !== 'cancelled'; })
        .slice(0, 3);
      const pending = apps.filter(a => ['applied', 'shortlisted'].includes(a.status)).slice(0, 3);
      const recent = apps.slice(0, 4);
      const AV = ['#ff4f00', '#2f7d4f', '#3b82f6', '#8b5cf6', '#ec4899', '#d97706'];

      content.innerHTML = `
        <!-- HERO -->
        <div class="dash-hero">
          <div>
            <h2>Good ${DashboardModule._greeting()}, ${firstName}! 👋</h2>
            <p class="sub">Here's what's happening with your internship program today.</p>
            <div class="dash-hero-mini">
              <div class="hero-mini"><span class="hm-ico ico-green"><i data-lucide="user-check"></i></span><div><b>${s.activeInterns || 0}</b><span>Active Interns</span></div></div>
              <div class="hero-mini"><span class="hm-ico ico-blue"><i data-lucide="file-text"></i></span><div><b>${s.totalApplications || 0}</b><span>Applications</span></div></div>
              <div class="hero-mini"><span class="hm-ico ico-amber"><i data-lucide="clock"></i></span><div><b>${s.pendingApplications || 0}</b><span>Pending Review</span></div></div>
            </div>
          </div>
          <div class="dash-hero-art"><canvas id="heroSpark"></canvas></div>
        </div>

        <!-- KPI ROW 1 -->
        <div class="kpi-grid">
          ${DashboardModule._kpi('users', 'ico-blue', s.totalInterns || 0, 'Total Interns')}
          ${DashboardModule._kpi('user-check', 'ico-green', s.activeInterns || 0, 'Active Interns')}
          ${DashboardModule._kpi('file-text', 'ico-orange', s.totalApplications || 0, 'Applications')}
          ${DashboardModule._kpi('clock', 'ico-amber', s.pendingApplications || 0, 'Pending Review')}
        </div>
        <!-- KPI ROW 2 -->
        <div class="kpi-grid cols-3">
          ${DashboardModule._kpi('check-square', 'ico-blue', s.todayAttendance || 0, 'Present Today')}
          ${DashboardModule._kpi('award', 'ico-purple', s.totalCertificates || 0, 'Certificates Issued')}
          ${DashboardModule._kpi('star', 'ico-pink', (s.avgEvaluationScore ? s.avgEvaluationScore : '-'), 'Average Score')}
        </div>

        <!-- QUICK ACTIONS -->
        <div class="qa-grid">
          ${DashboardModule._qa('applications', 'file-text', 'ico-orange', 'Review Applications', 'View and shortlisting')}
          ${DashboardModule._qa('interviews', 'calendar', 'ico-blue', 'Schedule Interview', 'Plan new interview')}
          ${DashboardModule._qa('attendance', 'clipboard-list', 'ico-green', 'Attendance Report', 'View attendance')}
          ${DashboardModule._qa('certificates', 'award', 'ico-purple', 'Generate Certificate', 'Create new certificate')}
          ${DashboardModule._qa('analytics', 'bar-chart-2', 'ico-amber', 'Full Analytics', 'Detailed insights')}
        </div>

        <!-- CHARTS -->
        <div class="dash-charts">
          <div class="panel">
            <div class="panel-head"><h4>Application Status</h4></div>
            <div style="display:grid;grid-template-columns:160px 1fr;gap:18px;align-items:center;">
              <div style="position:relative;height:170px;"><canvas id="appStatusChart"></canvas></div>
              <div id="appStatusLegend"></div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><h4>Monthly Applications</h4></div>
            <div style="position:relative;height:200px;"><canvas id="monthlyAppChart"></canvas></div>
          </div>
        </div>

        <!-- BOTTOM PANELS -->
        <div class="dash-cols">
          <div class="panel">
            <div class="panel-head"><h4>Recent Activity</h4><a onclick="App.navigate('applications')">View All</a></div>
            ${recent.length ? recent.map((a, idx) => `
              <div class="info-row">
                <div class="info-av" style="background:${AV[idx % AV.length]}">${getInitials(a.name)}</div>
                <div class="info-main">
                  <div class="info-t"><strong>${a.name}</strong> applied for ${a.department || 'Internship'}</div>
                  <div class="info-s">${timeAgo(a.createdAt)}</div>
                </div>
              </div>`).join('') : '<p class="text-muted" style="padding:10px 0">No recent activity</p>'}
          </div>

          <div class="panel">
            <div class="panel-head"><h4>Upcoming Interviews</h4><a onclick="App.navigate('interviews')">View All</a></div>
            ${upcoming.length ? upcoming.map((i, idx) => {
              const nm = i.candidateName || i.applicationId?.name || 'Candidate';
              const dept = i.applicationId?.department || i.mode || '';
              const d = new Date(i.scheduledAt || i.scheduledDate);
              return `
              <div class="info-row">
                <div class="info-av" style="background:${AV[idx % AV.length]}">${getInitials(nm)}</div>
                <div class="info-main">
                  <div class="info-t">${nm}</div>
                  <div class="info-s">${dept}</div>
                </div>
                <div class="info-meta">${d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}<br>${i.time || d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>`; }).join('') : '<p class="text-muted" style="padding:10px 0">No upcoming interviews</p>'}
          </div>

          <div class="panel">
            <div class="panel-head"><h4>Pending Reviews</h4><a onclick="App.navigate('applications')">View All</a></div>
            ${pending.length ? pending.map(a => `
              <div class="info-row">
                <div class="info-av" style="background:#f3ece2;color:#ff4f00"><i data-lucide="file-text" style="width:16px;height:16px"></i></div>
                <div class="info-main">
                  <div class="info-t"><strong>${a.name}</strong></div>
                  <div class="info-s">${a.department || ''} Intern</div>
                </div>
                <div class="info-meta">Applied on<br>${new Date(a.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>`).join('') : '<p class="text-muted" style="padding:10px 0">Nothing pending</p>'}
          </div>
        </div>`;

      lucide.createIcons();

      // ── Charts ──────────────────────────────────────────
      Chart.defaults.color = '#939084';
      Chart.defaults.borderColor = '#f0eadf';
      Chart.defaults.font.family = "'Inter', sans-serif";
      const COLORS = ['#3b82f6','#2f7d4f','#f59e0b','#8b5cf6','#d64545','#06b6d4','#ff4f00'];

      ['appStatus','monthly','spark'].forEach(k => dashCharts[k]?.destroy?.());

      // donut + custom legend
      const appStats = charts.appStats || [];
      const total = appStats.reduce((sum, x) => sum + x.count, 0) || 1;
      dashCharts.appStatus = new Chart(document.getElementById('appStatusChart'), {
        type: 'doughnut',
        data: { labels: appStats.map(x => (x._id||'').replace(/_/g,' ')), datasets: [{ data: appStats.map(x => x.count), backgroundColor: COLORS, borderWidth: 0, cutout: '68%' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
      const legend = document.getElementById('appStatusLegend');
      if (legend) legend.innerHTML = appStats.map((x, i) => {
        const pct = ((x.count/total)*100).toFixed(1);
        const lbl = (x._id||'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13.5px;">
          <span style="width:9px;height:9px;border-radius:3px;background:${COLORS[i%COLORS.length]}"></span>
          <span style="flex:1;color:#36342e;font-weight:500">${lbl}</span>
          <span style="color:#939084;font-weight:600">${x.count} (${pct}%)</span></div>`;
      }).join('') || '<p class="text-muted">No applications yet</p>';

      // monthly bars
      const monthlyApps = charts.monthlyApps || [];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      dashCharts.monthly = new Chart(document.getElementById('monthlyAppChart'), {
        type: 'bar',
        data: { labels: monthlyApps.map(m => months[m._id.month-1]), datasets: [{ data: monthlyApps.map(m => m.count), backgroundColor: '#ff4f00', borderRadius: 6, maxBarThickness: 26 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f4efe7' } }, x: { grid: { display: false } } } }
      });

      // hero sparkline (real monthly data)
      const sparkEl = document.getElementById('heroSpark');
      if (sparkEl) dashCharts.spark = new Chart(sparkEl, {
        type: 'line',
        data: { labels: monthlyApps.map(m => months[m._id.month-1]), datasets: [{ data: monthlyApps.map(m => m.count), borderColor: '#ff4f00', backgroundColor: 'rgba(255,79,0,0.10)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });

    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load dashboard: ${err.message}</div>`; }
  },

  _kpi: (icon, tint, value, label) => `
    <div class="kpi-card">
      <div class="kpi-top"><span class="kpi-ico ${tint}"><i data-lucide="${icon}"></i></span></div>
      <div class="kpi-val">${value}</div>
      <div class="kpi-label">${label}</div>
    </div>`,

  _qa: (module, icon, tint, title, sub) => `
    <button class="qa-card" onclick="App.navigate('${module}')">
      <span class="qa-ico ${tint}"><i data-lucide="${icon}"></i></span>
      <span><span class="qa-t" style="display:block">${title}</span><span class="qa-s">${sub}</span></span>
      <i data-lucide="chevron-right" class="qa-chev"></i>
    </button>`,

  _renderMentor: async (content) => {
    try {
      const [statsData, tasksData, internsData] = await Promise.all([
        API.get('/analytics/mentor'),
        API.get('/tasks?status=submitted'),
        API.get('/users?role=intern')
      ]);
      const s = statsData.stats || {};
      const tasks = tasksData.tasks || [];
      const interns = internsData.users || [];

      content.innerHTML = `
        <div class="welcome-banner">
          <div class="welcome-text">
            <h2>Good ${DashboardModule._greeting()}, <span>${Auth.user.name.split(' ')[0]}</span>!</h2>
            <p>You have ${tasks.length} task(s) awaiting your review</p>
          </div>
          <div class="welcome-emoji"><i data-lucide="book-open" style="width:48px;height:48px;color:#f59e0b"></i></div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue"><i data-lucide="users"></i></div><div class="stat-info"><div class="stat-value">${s.assignedInterns || 0}</div><div class="stat-label">Assigned Interns</div></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i data-lucide="check-square"></i></div><div class="stat-info"><div class="stat-value">${s.tasks || 0}</div><div class="stat-label">Tasks Assigned</div></div></div>
          <div class="stat-card"><div class="stat-icon orange"><i data-lucide="inbox"></i></div><div class="stat-info"><div class="stat-value">${s.pendingReviews || 0}</div><div class="stat-label">Pending Reviews</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i data-lucide="star"></i></div><div class="stat-info"><div class="stat-value">${s.evaluations || 0}</div><div class="stat-label">Evaluations Done</div></div></div>
        </div>

        <div class="quick-actions">
          <button class="quick-action-btn" onclick="App.navigate('tasks')"><i data-lucide="check-square"></i> Review Tasks</button>
          <button class="quick-action-btn" onclick="App.navigate('evaluation')"><i data-lucide="star"></i> Submit Evaluation</button>
          <button class="quick-action-btn" onclick="App.navigate('attendance')"><i data-lucide="clock"></i> View Attendance</button>
          <button class="quick-action-btn" onclick="App.navigate('communication')"><i data-lucide="message-square"></i> Messages</button>
        </div>

        <div class="intern-list-card glass-card">
          <h4 style="padding:16px 24px;border-bottom:1px solid var(--border-color)">My Interns</h4>
          ${interns.slice(0, 8).map(i => `
            <div class="intern-list-item">
              <div class="avatar">${getInitials(i.name)}</div>
              <div class="intern-list-info">
                <div class="intern-list-name">${i.name}</div>
                <div class="intern-list-dept">${i.department || 'No department'} · ${i.college || ''}</div>
              </div>
              <span class="status-badge ${i.isActive ? 'status-present' : 'status-absent'}">${i.isActive ? 'Active' : 'Inactive'}</span>
            </div>`).join('') || '<div class="empty-state"><p>No interns assigned yet</p></div>'}
        </div>

        ${tasks.length ? `
          <div class="glass-card" style="margin-top:16px;padding:20px">
            <h4 style="margin-bottom:16px"><i data-lucide="inbox"></i> Pending Task Reviews</h4>
            <div class="table-container">
              <table><thead><tr><th>Task</th><th>Intern</th><th>Submitted</th><th>Action</th></tr></thead>
              <tbody>
                ${tasks.map(t => `<tr>
                  <td><strong>${t.title}</strong></td>
                  <td>${t.assignedTo?.name || '-'}</td>
                  <td>${timeAgo(t.submittedAt)}</td>
                  <td><button class="btn btn-primary btn-sm" onclick="App.navigate('tasks')"><i data-lucide="eye"></i> Review</button></td>
                </tr>`).join('')}
              </tbody></table>
            </div>
          </div>` : ''}`;

      lucide.createIcons();
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load dashboard: ${err.message}</div>`; }
  },

  _renderIntern: async (content) => {
    try {
      const [statsData, tasksData, announcementsData, todayData] = await Promise.all([
        API.get('/analytics/intern'),
        API.get('/tasks'),
        API.get('/announcements'),
        API.get('/attendance/today')
      ]);
      const s = statsData.stats || {};
      const tasks = (tasksData.tasks || []).slice(0, 3);
      const announcements = announcementsData.announcements || [];
      const todayRecord = todayData.record;

      const checkedIn = !!todayRecord?.checkIn;
      const checkedOut = !!todayRecord?.checkOut;

      content.innerHTML = `
        <div class="welcome-banner">
          <div class="welcome-text">
            <h2>Good ${DashboardModule._greeting()}, <span>${Auth.user.name.split(' ')[0]}</span>!</h2>
            <p>${Auth.user.department || ''} Intern · ${Auth.user.college || ''}</p>
          </div>
          <div class="welcome-emoji"><i data-lucide="briefcase" style="width:48px;height:48px;color:#f59e0b"></i></div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue"><i data-lucide="check-square"></i></div><div class="stat-info"><div class="stat-value">${s.totalTasks || 0}</div><div class="stat-label">Total Tasks</div></div></div>
          <div class="stat-card"><div class="stat-icon orange"><i data-lucide="clock"></i></div><div class="stat-info"><div class="stat-value">${s.pendingTasks || 0}</div><div class="stat-label">Pending Tasks</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i data-lucide="check-circle"></i></div><div class="stat-info"><div class="stat-value">${s.approvedTasks || 0}</div><div class="stat-label">Completed</div></div></div>
          <div class="stat-card"><div class="stat-icon cyan"><i data-lucide="calendar"></i></div><div class="stat-info"><div class="stat-value">${s.presentDays || 0}/${s.totalWorkingDays || 0}</div><div class="stat-label">Attendance</div></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i data-lucide="award"></i></div><div class="stat-info"><div class="stat-value">${s.certificates || 0}</div><div class="stat-label">Certificates</div></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i data-lucide="star"></i></div><div class="stat-info"><div class="stat-value">${s.latestEvaluation?.overallScore || '-'}</div><div class="stat-label">Latest Score</div></div></div>
        </div>

        <div class="dashboard-grid-2">
          <div class="att-widget glass-card">
            <h4><i data-lucide="clock"></i> Today's Attendance</h4>
            <div class="att-today-status">
              <div class="att-status-item">
                <div class="att-status-val" style="color:var(--accent-green)">${todayRecord?.checkIn || '--:--'}</div>
                <div class="att-status-lbl">Check In</div>
              </div>
              <div class="att-status-item">
                <div class="att-status-val" style="color:var(--accent-red)">${todayRecord?.checkOut || '--:--'}</div>
                <div class="att-status-lbl">Check Out</div>
              </div>
              <div class="att-status-item">
                <div class="att-status-val">${todayRecord ? statusBadge(todayRecord.status) : '<span class="text-muted">Not marked</span>'}</div>
                <div class="att-status-lbl">Status</div>
              </div>
            </div>
            ${!checkedIn ? `
              <div style="margin-bottom:8px">
                <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer">
                  <input type="checkbox" id="wfh-check" style="width:auto"> Work From Home today
                </label>
              </div>
              <button class="att-check-btn" id="check-btn" onclick="DashboardModule.markAttendance()">
                <i data-lucide="log-in"></i> Mark Check-In
              </button>` :
              !checkedOut ? `<button class="att-check-btn check-out" id="check-btn" onclick="DashboardModule.markAttendance()">
                <i data-lucide="log-out"></i> Mark Check-Out
              </button>` :
              `<div style="text-align:center;color:var(--accent-green);padding:12px;font-weight:600">Attendance Complete!</div>`}
          </div>

          <div class="glass-card" style="padding:20px">
            <h4 style="margin-bottom:16px"><i data-lucide="check-square"></i> My Tasks</h4>
            ${tasks.length ? tasks.map(t => `
              <div class="task-card" onclick="App.navigate('tasks')">
                <h5>${t.title}</h5>
                <p>${t.description || ''}</p>
                <div class="task-meta">
                  ${priorityBadge(t.priority)}
                  <span class="task-deadline ${isOverdue(t.deadline) ? 'overdue' : ''}">
                    ${formatDate(t.deadline)}
                  </span>
                </div>
              </div>`).join('') : renderEmpty('No tasks yet', 'Your mentor will assign tasks soon')}
            <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="App.navigate('tasks')">View All Tasks <i data-lucide="arrow-right"></i></button>
          </div>
        </div>

        <div class="activity-feed glass-card" style="margin-top:16px">
          <h4><i data-lucide="bell"></i> Announcements</h4>
          ${announcements.slice(0, 4).map(a => `
            <div class="activity-item">
              <div class="activity-dot ${a.isPinned ? 'gold' : 'blue'}"></div>
              <div>
                <div class="activity-text"><strong>${a.title}</strong>${a.isPinned ? ' <i data-lucide="pin" style="width:12px;height:12px;display:inline-block;vertical-align:middle;color:var(--accent-gold)"></i>' : ''}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px">${a.content.slice(0,100)}...</div>
                <div class="activity-time">${timeAgo(a.createdAt)}</div>
              </div>
            </div>`).join('') || '<p class="text-muted" style="padding:12px 0">No announcements</p>'}
        </div>`;

      lucide.createIcons();
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load dashboard: ${err.message}</div>`; }
  },

  markAttendance: async () => {
    const btn = document.getElementById('check-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Marking...'; }
    try {
      const isWFH = document.getElementById('wfh-check')?.checked;
      let location = {};
      if (navigator.geolocation) {
        try {
          location = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(
            p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => res({}), { timeout: 4000 }
          ));
        } catch {}
      }
      const result = await API.post('/attendance/mark', { type: isWFH ? 'wfh' : 'office', location });
      showToast(result.message, 'success');
      DashboardModule.render();
    } catch(err) { showToast(err.message, 'error'); if (btn) { btn.disabled = false; } }
  },

  _greeting: () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }
};
