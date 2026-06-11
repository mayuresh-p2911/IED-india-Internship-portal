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
      const [statsData, announcementsData] = await Promise.all([
        API.get('/analytics/summary'),
        API.get('/announcements')
      ]);
      const s = statsData.stats || {};
      const charts = statsData.charts || {};
      const announcements = announcementsData.announcements || [];

      content.innerHTML = `
        <div class="welcome-banner">
          <div class="welcome-text">
            <h2>Good ${DashboardModule._greeting()}, <span>${Auth.user.name.split(' ')[0]}</span>!</h2>
            <p>${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="welcome-emoji"><i data-lucide="bar-chart-2" style="width:48px;height:48px;color:#f59e0b"></i></div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue"><i data-lucide="users"></i></div><div class="stat-info"><div class="stat-value">${s.totalInterns || 0}</div><div class="stat-label">Total Interns</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i data-lucide="user-check"></i></div><div class="stat-info"><div class="stat-value">${s.activeInterns || 0}</div><div class="stat-label">Active Interns</div></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i data-lucide="file-text"></i></div><div class="stat-info"><div class="stat-value">${s.totalApplications || 0}</div><div class="stat-label">Applications</div></div></div>
          <div class="stat-card"><div class="stat-icon orange"><i data-lucide="clock"></i></div><div class="stat-info"><div class="stat-value">${s.pendingApplications || 0}</div><div class="stat-label">Pending Review</div></div></div>
          <div class="stat-card"><div class="stat-icon cyan"><i data-lucide="check-square"></i></div><div class="stat-info"><div class="stat-value">${s.todayAttendance || 0}</div><div class="stat-label">Present Today</div></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i data-lucide="award"></i></div><div class="stat-info"><div class="stat-value">${s.totalCertificates || 0}</div><div class="stat-label">Certificates Issued</div></div></div>
          <div class="stat-card"><div class="stat-icon red"><i data-lucide="calendar-off"></i></div><div class="stat-info"><div class="stat-value">${s.pendingLeaves || 0}</div><div class="stat-label">Pending Leaves</div></div></div>
          <div class="stat-card"><div class="stat-icon blue"><i data-lucide="star"></i></div><div class="stat-info"><div class="stat-value">${s.avgEvaluationScore || '-'}</div><div class="stat-label">Avg. Score</div></div></div>
        </div>

        <div class="quick-actions">
          <button class="quick-action-btn" onclick="App.navigate('applications')"><i data-lucide="file-plus"></i> Review Applications</button>
          <button class="quick-action-btn" onclick="App.navigate('interviews')"><i data-lucide="calendar-plus"></i> Schedule Interview</button>
          <button class="quick-action-btn" onclick="App.navigate('attendance')"><i data-lucide="clock"></i> Attendance Report</button>
          <button class="quick-action-btn" onclick="App.navigate('certificates')"><i data-lucide="award"></i> Generate Certificate</button>
          <button class="quick-action-btn" onclick="App.navigate('analytics')"><i data-lucide="bar-chart-2"></i> Full Analytics</button>
        </div>

        <div class="chart-grid">
          <div class="chart-card glass-card">
            <h4>Application Status</h4>
            <div class="chart-wrap"><canvas id="appStatusChart"></canvas></div>
          </div>
          <div class="chart-card glass-card">
            <h4>Monthly Applications</h4>
            <div class="chart-wrap"><canvas id="monthlyAppChart"></canvas></div>
          </div>
        </div>

        <div class="dashboard-grid-3">
          <div class="activity-feed glass-card">
            <h4><i data-lucide="activity"></i> Announcements</h4>
            ${announcements.slice(0, 5).map(a => `
              <div class="activity-item">
                <div class="activity-dot blue"></div>
                <div>
                  <div class="activity-text"><strong>${a.title}</strong></div>
                  <div class="activity-time">${timeAgo(a.createdAt)} · by ${a.postedBy?.name || 'System'}</div>
                </div>
              </div>`).join('') || '<p class="text-muted" style="padding:12px 0">No announcements yet</p>'}
          </div>
          <div class="chart-card glass-card">
            <h4>Department Distribution</h4>
            <div class="chart-wrap"><canvas id="deptChart"></canvas></div>
          </div>
        </div>`;

      lucide.createIcons();

      // Render charts
      Chart.defaults.color = '#475569';
      Chart.defaults.borderColor = '#e2e8f0';
      const COLORS = ['#3b82f6','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316'];

      if (dashCharts.appStatus) dashCharts.appStatus.destroy();
      if (dashCharts.monthly) dashCharts.monthly.destroy();
      if (dashCharts.dept) dashCharts.dept.destroy();

      const appStats = charts.appStats || [];
      dashCharts.appStatus = new Chart(document.getElementById('appStatusChart'), {
        type: 'doughnut',
        data: {
          labels: appStats.map(s => s._id?.replace(/_/g,' ')),
          datasets: [{ data: appStats.map(s => s.count), backgroundColor: COLORS, borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });

      const monthlyApps = charts.monthlyApps || [];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      dashCharts.monthly = new Chart(document.getElementById('monthlyAppChart'), {
        type: 'bar',
        data: {
          labels: monthlyApps.map(m => `${months[m._id.month-1]} ${m._id.year}`),
          datasets: [{ label: 'Applications', data: monthlyApps.map(m => m.count), backgroundColor: 'rgba(79,142,247,0.7)', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });

      const deptStats = charts.deptStats || [];
      dashCharts.dept = new Chart(document.getElementById('deptChart'), {
        type: 'bar',
        data: {
          labels: deptStats.map(d => d._id || 'Unknown'),
          datasets: [{ data: deptStats.map(d => d.count), backgroundColor: COLORS, borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
      });

    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load dashboard: ${err.message}</div>`; }
  },

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
