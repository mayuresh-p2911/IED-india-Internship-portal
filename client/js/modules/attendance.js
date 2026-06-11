// ═══════════════════════════════════════════════════════════
// IED India IMS — Attendance Module
// ═══════════════════════════════════════════════════════════

window.AttendanceModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    const isIntern = Auth.is('intern');
    content.innerHTML = renderLoading();
    try {
      if (isIntern) {
        await AttendanceModule._renderIntern(content);
      } else {
        await AttendanceModule._renderAdmin(content);
      }
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load attendance: ${err.message}</div>`; }
  },

  _renderIntern: async (content) => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const [todayData, reportData] = await Promise.all([
      API.get('/attendance/today'),
      API.get(`/attendance/report?month=${month}&year=${year}`)
    ]);
    const today = todayData.record;
    const summary = reportData.summary || {};
    const records = reportData.records || [];
    const checkedIn = !!today?.checkIn, checkedOut = !!today?.checkOut;

    content.innerHTML = `
      <div class="page-header">
        <div><h2>Attendance</h2><p>Track your daily attendance and view monthly history</p></div>
        <button class="btn btn-secondary" onclick="App.navigate('leaves')"><i data-lucide="calendar-off"></i> Apply Leave</button>
      </div>

      <div class="dashboard-grid-2" style="margin-bottom:24px">
        <div class="att-widget glass-card">
          <h4 style="margin-bottom:16px"><i data-lucide="clock"></i> Today — ${now.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long'})}</h4>
          <div class="att-today-status">
            <div class="att-status-item">
              <div class="att-status-val" style="color:var(--accent-green)">${today?.checkIn||'--:--'}</div>
              <div class="att-status-lbl">Check In</div>
            </div>
            <div class="att-status-item">
              <div class="att-status-val" style="color:var(--accent-red)">${today?.checkOut||'--:--'}</div>
              <div class="att-status-lbl">Check Out</div>
            </div>
            <div class="att-status-item">
              <div class="att-status-val">${today ? statusBadge(today.status) : '<span style="color:var(--text-muted)">Not marked</span>'}</div>
              <div class="att-status-lbl">Status</div>
            </div>
          </div>
          ${!checkedIn ? `
            <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer;margin-bottom:12px">
              <input type="checkbox" id="wfh-chk" style="width:auto"> Working From Home today
            </label>
            <button class="att-check-btn" onclick="AttendanceModule.markCheckIn()"><i data-lucide="log-in"></i> Mark Check-In</button>`
          : !checkedOut ? `<button class="att-check-btn check-out" onclick="AttendanceModule.markCheckOut()"><i data-lucide="log-out"></i> Mark Check-Out</button>`
          : `<div style="text-align:center;padding:16px;color:var(--accent-green);font-weight:600">Attendance Complete for Today!</div>`}
          ${today?.location?.lat ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;text-align:center"><i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;vertical-align:middle"></i> Location recorded</p>` : ''}
        </div>

        <div class="glass-card" style="padding:20px">
          <h4 style="margin-bottom:16px">This Month Summary</h4>
          <div class="stats-grid" style="grid-template-columns:1fr 1fr">
            <div class="stat-card"><div class="stat-icon green"><i data-lucide="check-circle"></i></div><div class="stat-info"><div class="stat-value">${summary.present||0}</div><div class="stat-label">Present</div></div></div>
            <div class="stat-card"><div class="stat-icon red"><i data-lucide="x-circle"></i></div><div class="stat-info"><div class="stat-value">${summary.absent||0}</div><div class="stat-label">Absent</div></div></div>
            <div class="stat-card"><div class="stat-icon cyan"><i data-lucide="home"></i></div><div class="stat-info"><div class="stat-value">${summary.wfh||0}</div><div class="stat-label">WFH</div></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i data-lucide="calendar-off"></i></div><div class="stat-info"><div class="stat-value">${summary.on_leave||0}</div><div class="stat-label">On Leave</div></div></div>
          </div>
        </div>
      </div>

      <div class="glass-card" style="padding:20px;margin-bottom:24px">
        <h4 style="margin-bottom:16px"><i data-lucide="calendar"></i> Monthly Calendar — ${now.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</h4>
        ${AttendanceModule._buildCalendar(now.getFullYear(), now.getMonth(), records)}
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:16px;font-size:0.8rem">
          <span><span class="att-day present" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:4px">P</span> Present</span>
          <span><span class="att-day absent" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:4px">A</span> Absent</span>
          <span><span class="att-day wfh" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:4px">W</span> WFH</span>
          <span><span class="att-day on_leave" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:4px">L</span> Leave</span>
        </div>
      </div>

      <div class="table-container glass-card">
        <table>
          <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Type</th><th>Status</th><th>Location</th></tr></thead>
          <tbody>
            ${records.length ? records.map(r=>`<tr>
              <td><strong>${r.date}</strong></td>
              <td>${r.checkIn||'-'}</td><td>${r.checkOut||'-'}</td>
              <td><span class="status-badge" style="text-transform:capitalize">${r.type||'-'}</span></td>
              <td>${statusBadge(r.status)}</td>
              <td style="font-size:0.75rem">${r.location?.lat ? `<i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;vertical-align:middle"></i> ${r.location.lat?.toFixed(4)}, ${r.location.lng?.toFixed(4)}` : '-'}</td>
            </tr>`).join('')
            : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">No records for this month</td></tr>`}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons();
  },

  _renderAdmin: async (content) => {
    const now = new Date();
    const [usersData, reportData] = await Promise.all([
      API.get('/users?role=intern'),
      API.get(`/attendance?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
    ]);
    const interns = usersData.users || [];
    const records = reportData.records || [];

    content.innerHTML = `
      <div class="page-header">
        <div><h2>Attendance Management</h2><p>Monitor intern attendance across the organisation</p></div>
        <button class="btn btn-secondary" onclick="showToast('Export feature coming soon','info')"><i data-lucide="download"></i> Export Report</button>
      </div>
      <div class="filter-bar glass-card" style="padding:16px;margin-bottom:16px">
        <div class="search-input"><i data-lucide="search"></i><input type="text" id="att-search" placeholder="Search intern..." oninput="AttendanceModule.filterRecords()" /></div>
        <select id="att-intern" style="width:200px" onchange="AttendanceModule.loadInternReport()">
          <option value="">All Interns</option>
          ${interns.map(i=>`<option value="${i._id}">${i.name}</option>`).join('')}
        </select>
        <input type="month" id="att-month" value="${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}" onchange="AttendanceModule.loadInternReport()" style="width:160px" />
      </div>

      <div class="stats-grid" id="att-summary" style="margin-bottom:24px">
        <div class="stat-card"><div class="stat-icon green"><i data-lucide="check-circle"></i></div><div class="stat-info"><div class="stat-value">${records.filter(r=>r.status==='present').length}</div><div class="stat-label">Present Days</div></div></div>
        <div class="stat-card"><div class="stat-icon red"><i data-lucide="x-circle"></i></div><div class="stat-info"><div class="stat-value">${records.filter(r=>r.status==='absent').length}</div><div class="stat-label">Absent Days</div></div></div>
        <div class="stat-card"><div class="stat-icon cyan"><i data-lucide="home"></i></div><div class="stat-info"><div class="stat-value">${records.filter(r=>r.status==='wfh').length}</div><div class="stat-label">WFH Days</div></div></div>
        <div class="stat-card"><div class="stat-icon purple"><i data-lucide="calendar-off"></i></div><div class="stat-info"><div class="stat-value">${records.filter(r=>r.status==='on_leave').length}</div><div class="stat-label">On Leave</div></div></div>
      </div>

      <div class="table-container glass-card" id="att-table">
        <table>
          <thead><tr><th>Intern</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Type</th><th>Status</th></tr></thead>
          <tbody id="att-tbody">
            ${AttendanceModule._renderRows(records)}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons();
  },

  _renderRows: (records) => records.length
    ? records.map(r=>`<tr>
        <td><strong>${r.internId?.name||'-'}</strong><br><small class="text-muted">${r.internId?.department||''}</small></td>
        <td>${r.date}</td><td>${r.checkIn||'-'}</td><td>${r.checkOut||'-'}</td>
        <td><span class="status-badge" style="text-transform:capitalize">${r.type||'-'}</span></td>
        <td>${statusBadge(r.status)}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">No records found</td></tr>`,

  loadInternReport: async () => {
    const internId = document.getElementById('att-intern')?.value;
    const monthVal = document.getElementById('att-month')?.value;
    let url = '/attendance?';
    if (internId) url += `internId=${internId}&`;
    if (monthVal) { const [y,m] = monthVal.split('-'); url += `month=${m}&year=${y}`; }
    try {
      const data = await API.get(url);
      const records = data.records || [];
      const tbody = document.getElementById('att-tbody');
      if (tbody) tbody.innerHTML = AttendanceModule._renderRows(records);
      lucide.createIcons();
    } catch(err) { showToast(err.message, 'error'); }
  },

  filterRecords: () => {
    const q = document.getElementById('att-search')?.value?.toLowerCase();
    document.querySelectorAll('#att-tbody tr').forEach(row => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  markCheckIn: async () => {
    let location = {};
    if (navigator.geolocation) {
      location = await new Promise(res => navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res({}), { timeout: 5000 }
      ));
    }
    const isWFH = document.getElementById('wfh-chk')?.checked;
    try {
      const result = await API.post('/attendance/mark', { type: isWFH ? 'wfh' : 'office', location });
      showToast(result.message, 'success');
      AttendanceModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  markCheckOut: async () => {
    try {
      const result = await API.post('/attendance/mark', {});
      showToast(result.message, 'success');
      AttendanceModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  _buildCalendar: (year, month, records) => {
    const recordMap = {};
    records.forEach(r => { recordMap[r.date] = r.status; });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = `<div class="att-calendar">${days.map(d=>`<div style="font-size:0.7rem;color:var(--text-muted);text-align:center;font-weight:600">${d}</div>`).join('')}`;
    for (let i = 0; i < firstDay; i++) html += `<div class="att-day" style="visibility:hidden"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const status = recordMap[dateStr];
      const dow = new Date(year, month, d).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isFuture = dateStr > todayStr;
      const cls = isFuture ? 'future' : isWeekend ? 'weekend' : (status || 'absent');
      const isToday = dateStr === todayStr ? ' today' : '';
      const label = status === 'present' ? 'P' : status === 'wfh' ? 'W' : status === 'on_leave' ? 'L' : status === 'late' ? 'L' : d;
      html += `<div class="att-day ${cls}${isToday}" title="${dateStr}${status?' - '+status:''}">${isFuture || isWeekend ? d : label}</div>`;
    }
    return html + '</div>';
  }
};
