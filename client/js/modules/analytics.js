// ═══════════════════════════════════════════════════════════
// IED India IMS — Analytics Module
// ═══════════════════════════════════════════════════════════

let analyticsCharts = {};

window.AnalyticsModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    content.innerHTML = renderLoading();
    try {
      const data = await API.get('/analytics/summary');
      const s = data.stats || {};
      const c = data.charts || {};

      content.innerHTML = `
        <div class="page-header">
          <div><h2>Analytics & Reports</h2><p>Platform-wide internship statistics and insights</p></div>
          <button class="btn btn-secondary" onclick="AnalyticsModule.render()"><i data-lucide="refresh-cw"></i> Refresh</button>
        </div>

        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
          <div class="stat-card"><div class="stat-icon blue"><i data-lucide="users"></i></div><div class="stat-info"><div class="stat-value">${s.totalInterns||0}</div><div class="stat-label">Total Interns</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i data-lucide="user-check"></i></div><div class="stat-info"><div class="stat-value">${s.activeInterns||0}</div><div class="stat-label">Active Interns</div></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i data-lucide="file-text"></i></div><div class="stat-info"><div class="stat-value">${s.totalApplications||0}</div><div class="stat-label">Applications</div></div></div>
          <div class="stat-card"><div class="stat-icon cyan"><i data-lucide="star"></i></div><div class="stat-info"><div class="stat-value">${s.avgEvaluationScore||'-'}</div><div class="stat-label">Avg Eval Score</div></div></div>
        </div>

        <div class="chart-grid" style="grid-template-columns:1fr 1fr">
          <div class="chart-card glass-card"><h4>Department Distribution</h4><div class="chart-wrap"><canvas id="a-dept"></canvas></div></div>
          <div class="chart-card glass-card"><h4>Application Status Breakdown</h4><div class="chart-wrap"><canvas id="a-appstatus"></canvas></div></div>
        </div>
        <div class="chart-grid" style="grid-template-columns:1fr 1fr;margin-top:16px">
          <div class="chart-card glass-card"><h4>Monthly Applications (Last 6 Months)</h4><div class="chart-wrap"><canvas id="a-monthly"></canvas></div></div>
          <div class="chart-card glass-card"><h4>Task Status Overview</h4><div class="chart-wrap"><canvas id="a-tasks"></canvas></div></div>
        </div>

        <div class="dashboard-grid-2" style="margin-top:16px">
          <div class="glass-card" style="padding:20px">
            <h4 style="margin-bottom:16px">Key Metrics</h4>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${[
                ['Active Intern Rate', s.totalInterns ? Math.round((s.activeInterns/s.totalInterns)*100) : 0, 'var(--accent-green)'],
                ['Task Completion Rate', s.totalTasks ? Math.round((s.completedTasks/s.totalTasks)*100) : 0, 'var(--accent-blue)'],
                ['Application Selection Rate', s.totalApplications ? Math.round(((c.appStats||[]).find(a=>a._id==='selected')?.count||0)/s.totalApplications*100) : 0, 'var(--accent-gold)'],
              ].map(([label, pct, color]) => `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem">
                    <span>${label}</span><strong style="color:${color}">${pct}%</strong>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
                </div>`).join('')}
            </div>
          </div>
          <div class="glass-card" style="padding:20px">
            <h4 style="margin-bottom:16px">Summary Counts</h4>
            ${[
              ['Total Tasks', s.totalTasks||0, 'check-square'],
              ['Pending Tasks', s.pendingTasks||0, 'clock'],
              ['Completed Tasks', s.completedTasks||0, 'check-circle'],
              ['Certificates Issued', s.totalCertificates||0, 'award'],
              ['Pending Leaves', s.pendingLeaves||0, 'calendar-off'],
              ['Today Present', s.todayAttendance||0, 'user-check'],
            ].map(([l,v,icon]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color)">
                <div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:0.875rem">
                  <i data-lucide="${icon}" style="width:16px;height:16px"></i>${l}
                </div>
                <strong>${v}</strong>
              </div>`).join('')}
          </div>
        </div>`;

      lucide.createIcons();

      Chart.defaults.color = '#475569';
      Chart.defaults.borderColor = '#e2e8f0';
      const COLORS = ['#3b82f6','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316'];

      ['dept','appstatus','monthly','tasks'].forEach(k => { if (analyticsCharts[k]) { analyticsCharts[k].destroy(); delete analyticsCharts[k]; } });

      // Dept chart
      const dept = c.deptStats || [];
      analyticsCharts.dept = new Chart(document.getElementById('a-dept'), {
        type: 'bar',
        data: { labels: dept.map(d=>d._id||'Unknown'), datasets: [{ data: dept.map(d=>d.count), backgroundColor: COLORS, borderRadius: 6 }] },
        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true}} }
      });

      // App status
      const apps = c.appStats || [];
      analyticsCharts.appstatus = new Chart(document.getElementById('a-appstatus'), {
        type: 'doughnut',
        data: { labels: apps.map(a=>a._id?.replace(/_/g,' ')), datasets: [{ data: apps.map(a=>a.count), backgroundColor: COLORS, borderWidth:0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
      });

      // Monthly
      const monthly = c.monthlyApps || [];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      analyticsCharts.monthly = new Chart(document.getElementById('a-monthly'), {
        type: 'line',
        data: {
          labels: monthly.map(m=>`${months[m._id.month-1]} ${m._id.year}`),
          datasets: [{ label:'Applications', data: monthly.map(m=>m.count), borderColor:'#4f8ef7', backgroundColor:'rgba(79,142,247,0.15)', fill:true, tension:0.4, pointBackgroundColor:'#4f8ef7' }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
      });

      // Tasks
      const tasks = c.taskStats || [];
      analyticsCharts.tasks = new Chart(document.getElementById('a-tasks'), {
        type: 'doughnut',
        data: { labels: tasks.map(t=>t._id?.replace(/_/g,' ')), datasets: [{ data: tasks.map(t=>t.count), backgroundColor: COLORS, borderWidth:0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
      });

    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load analytics: ${err.message}</div>`; }
  }
};
