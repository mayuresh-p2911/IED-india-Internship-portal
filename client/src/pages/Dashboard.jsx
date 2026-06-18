import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, timeAgo, getInitials, isOverdue } from '../utils/helpers';
import DynamicIcon from '../components/DynamicIcon';
import {
  UserCheck,
  FileText,
  Clock,
  CheckSquare,
  Award,
  Star,
  Calendar,
  ChevronRight,
  Inbox,
  Eye,
  BookOpen,
  Briefcase,
  LogIn,
  LogOut,
  Bell,
  Pin
} from 'lucide-react';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

export function Dashboard({ onNavigate }) {
  const { user, is } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Role-based state
  const [adminData, setAdminData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [internData, setInternData] = useState(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  const getGreetingEmoji = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅';
    if (h < 17) return '☀️';
    return '🌙';
  };

  // Load Admin/HR Dashboard
  const loadAdminHR = async () => {
    try {
      const [statsData, appsData, interviewsData] = await Promise.all([
        API.get('/analytics/summary'),
        API.get('/applications?limit=12').catch(() => ({ applications: [] })),
        API.get('/interviews').catch(() => ({ interviews: [] }))
      ]);
      setAdminData({
        stats: statsData.stats || {},
        charts: statsData.charts || {},
        applications: appsData.applications || [],
        interviews: interviewsData.interviews || []
      });
    } catch (err) {
      showToast(err.message || 'Failed to load summary analytics', 'error');
    }
  };

  // Load Mentor Dashboard
  const loadMentor = async () => {
    try {
      const [statsData, tasksData, internsData] = await Promise.all([
        API.get('/analytics/mentor'),
        API.get('/tasks?status=submitted'),
        API.get('/users?role=intern')
      ]);
      setMentorData({
        stats: statsData.stats || {},
        tasks: tasksData.tasks || [],
        interns: internsData.users || []
      });
    } catch (err) {
      showToast(err.message || 'Failed to load mentor analytics', 'error');
    }
  };

  // Load Intern Dashboard
  const loadIntern = async () => {
    try {
      const [statsData, tasksData, announcementsData, todayData] = await Promise.all([
        API.get('/analytics/intern'),
        API.get('/tasks'),
        API.get('/announcements'),
        API.get('/attendance/today')
      ]);
      setInternData({
        stats: statsData.stats || {},
        tasks: (tasksData.tasks || []).slice(0, 3),
        announcements: announcementsData.announcements || [],
        todayRecord: todayData.record || null,
        wfh: false
      });
    } catch (err) {
      showToast(err.message || 'Failed to load intern data', 'error');
    }
  };

  const initDashboard = async () => {
    setLoading(true);
    const role = user?.role;
    if (role === 'admin' || role === 'hr') {
      await loadAdminHR();
    } else if (role === 'mentor') {
      await loadMentor();
    } else {
      await loadIntern();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      initDashboard();
    }
  }, [user]);

  const markAttendance = async () => {
    try {
      let location = {};
      if (navigator.geolocation) {
        try {
          location = await new Promise((res) => {
            navigator.geolocation.getCurrentPosition(
              (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
              () => res({}),
              { timeout: 4000 }
            );
          });
        } catch {}
      }
      const type = internData?.wfh ? 'wfh' : 'office';
      const result = await API.post('/attendance/mark', { type, location });
      showToast(result.message, 'success');
      loadIntern();
    } catch (err) {
      showToast(err.message || 'Failed to mark attendance', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER ADMIN / HR
  // ═══════════════════════════════════════════════════════════
  if (is('admin', 'hr')) {
    if (!adminData) return null;
    const { stats, charts, applications, interviews } = adminData;
    const firstName = (user.name || 'there').split(' ')[0];
    const now = Date.now();
    const upcoming = interviews
      .filter((i) => {
        const t = new Date(i.scheduledAt || i.scheduledDate).getTime();
        return t && t >= now && i.status !== 'cancelled';
      })
      .slice(0, 3);
    const pending = applications
      .filter((a) => ['applied', 'shortlisted'].includes(a.status))
      .slice(0, 3);
    const recent = applications.slice(0, 4);
    const AV = ['#ff4f00', '#2f7d4f', '#3b82f6', '#8b5cf6', '#ec4899', '#d97706'];

    // Donut chart setup
    const appStats = charts.appStats || [];
    const total = appStats.reduce((sum, x) => sum + x.count, 0) || 1;
    const donutColors = ['#3b82f6', '#2f7d4f', '#f59e0b', '#8b5cf6', '#d64545', '#06b6d4', '#ff4f00'];

    const donutData = {
      labels: appStats.map((x) => (x._id || '').replace(/_/g, ' ')),
      datasets: [
        {
          data: appStats.map((x) => x.count),
          backgroundColor: donutColors,
          borderWidth: 0,
          cutout: '68%'
        }
      ]
    };

    const donutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    };

    // Monthly Bar chart setup
    const monthlyApps = charts.monthlyApps || [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const barData = {
      labels: monthlyApps.map((m) => months[m._id.month - 1]),
      datasets: [
        {
          data: monthlyApps.map((m) => m.count),
          backgroundColor: '#ff4f00',
          borderRadius: 6,
          maxBarThickness: 26
        }
      ]
    };

    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f4efe7' },
          ticks: { color: '#939084', font: { family: "'Inter', sans-serif" } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#939084', font: { family: "'Inter', sans-serif" } }
        }
      }
    };

    // Hero sparkline data
    const sparkData = {
      labels: monthlyApps.map((m) => months[m._id.month - 1]),
      datasets: [
        {
          data: monthlyApps.map((m) => m.count),
          borderColor: '#ff4f00',
          backgroundColor: 'rgba(255,79,0,0.10)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    };

    const sparkOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    };

    return (
      <>
        {/* HERO */}
        <div className="dash-hero">
          <div>
            <h2>Good {greeting()}, {firstName}! 👋</h2>
            <p className="sub">Here's what's happening with your internship program today.</p>
            <div className="dash-hero-mini">
              <div className="hero-mini">
                <span className="hm-ico ico-green">
                  <UserCheck size={18} />
                </span>
                <div>
                  <b>{stats.activeInterns || 0}</b>
                  <span>Active Interns</span>
                </div>
              </div>
              <div className="hero-mini">
                <span className="hm-ico ico-blue">
                  <FileText size={18} />
                </span>
                <div>
                  <b>{stats.totalApplications || 0}</b>
                  <span>Applications</span>
                </div>
              </div>
              <div className="hero-mini">
                <span className="hm-ico ico-amber">
                  <Clock size={18} />
                </span>
                <div>
                  <b>{stats.pendingApplications || 0}</b>
                  <span>Pending Review</span>
                </div>
              </div>
            </div>
          </div>
          <div className="dash-hero-art">
            <Line data={sparkData} options={sparkOptions} />
          </div>
        </div>

        {/* KPI ROW 1 */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-blue"><DynamicIcon name="users" size={18} /></span></div>
            <div className="kpi-val">{stats.totalInterns || 0}</div>
            <div className="kpi-label">Total Interns</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-green"><DynamicIcon name="user-check" size={18} /></span></div>
            <div className="kpi-val">{stats.activeInterns || 0}</div>
            <div className="kpi-label">Active Interns</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-orange"><DynamicIcon name="file-text" size={18} /></span></div>
            <div className="kpi-val">{stats.totalApplications || 0}</div>
            <div className="kpi-label">Applications</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-amber"><DynamicIcon name="clock" size={18} /></span></div>
            <div className="kpi-val">{stats.pendingApplications || 0}</div>
            <div className="kpi-label">Pending Review</div>
          </div>
        </div>

        {/* KPI ROW 2 */}
        <div className="kpi-grid cols-3">
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-blue"><DynamicIcon name="check-square" size={18} /></span></div>
            <div className="kpi-val">{stats.todayAttendance || 0}</div>
            <div className="kpi-label">Present Today</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-purple"><DynamicIcon name="award" size={18} /></span></div>
            <div className="kpi-val">{stats.totalCertificates || 0}</div>
            <div className="kpi-label">Certificates Issued</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span className="kpi-ico ico-pink"><DynamicIcon name="star" size={18} /></span></div>
            <div className="kpi-val">{stats.avgEvaluationScore ? stats.avgEvaluationScore : '-'}</div>
            <div className="kpi-label">Average Score</div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="qa-grid">
          <button className="qa-card" onClick={() => onNavigate('applications')}>
            <span className="qa-ico ico-orange"><FileText size={18} /></span>
            <span>
              <span className="qa-t" style={{ display: 'block' }}>Review Applications</span>
              <span className="qa-s">View and shortlisting</span>
            </span>
            <ChevronRight className="qa-chev" size={16} />
          </button>
          <button className="qa-card" onClick={() => onNavigate('interviews')}>
            <span className="qa-ico ico-blue"><Calendar size={18} /></span>
            <span>
              <span className="qa-t" style={{ display: 'block' }}>Schedule Interview</span>
              <span className="qa-s">Plan new interview</span>
            </span>
            <ChevronRight className="qa-chev" size={16} />
          </button>
          <button className="qa-card" onClick={() => onNavigate('attendance')}>
            <span className="qa-ico ico-green"><DynamicIcon name="clipboard-list" size={18} /></span>
            <span>
              <span className="qa-t" style={{ display: 'block' }}>Attendance Report</span>
              <span className="qa-s">View attendance</span>
            </span>
            <ChevronRight className="qa-chev" size={16} />
          </button>
          <button className="qa-card" onClick={() => onNavigate('certificates')}>
            <span className="qa-ico ico-purple"><Award size={18} /></span>
            <span>
              <span className="qa-t" style={{ display: 'block' }}>Generate Certificate</span>
              <span className="qa-s">Create new certificate</span>
            </span>
            <ChevronRight className="qa-chev" size={16} />
          </button>
          <button className="qa-card" onClick={() => onNavigate('analytics')}>
            <span className="qa-ico ico-amber"><DynamicIcon name="bar-chart-2" size={18} /></span>
            <span>
              <span className="qa-t" style={{ display: 'block' }}>Full Analytics</span>
              <span className="qa-s">Detailed insights</span>
            </span>
            <ChevronRight className="qa-chev" size={16} />
          </button>
        </div>

        {/* CHARTS */}
        <div className="dash-charts">
          <div className="panel">
            <div className="panel-head">
              <h4>Application Status</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '18px', alignItems: 'center' }}>
              <div style={{ position: 'relative', height: '170px' }}>
                <Doughnut data={donutData} options={donutOptions} />
              </div>
              <div id="appStatusLegend">
                {appStats.length ? (
                  appStats.map((x, i) => {
                    const pct = ((x.count / total) * 100).toFixed(1);
                    const lbl = (x._id || '')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div
                        key={i}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13.5px' }}
                      >
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '3px',
                            backgroundColor: donutColors[i % donutColors.length]
                          }}
                        ></span>
                        <span style={{ flex: 1, color: '#36342e', fontWeight: 500 }}>{lbl}</span>
                        <span style={{ color: '#939084', fontWeight: 600 }}>
                          {x.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted">No applications yet</p>
                )}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h4>Monthly Applications</h4>
            </div>
            <div style={{ position: 'relative', height: '200px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div className="dash-cols">
          <div className="panel">
            <div className="panel-head">
              <h4>Recent Activity</h4>
              <a onClick={() => onNavigate('applications')} style={{ cursor: 'pointer' }}>
                View All
              </a>
            </div>
            {recent.length ? (
              recent.map((a, idx) => (
                <div className="info-row" key={a._id || idx}>
                  <div className="info-av" style={{ backgroundColor: AV[idx % AV.length] }}>
                    {getInitials(a.name)}
                  </div>
                  <div className="info-main">
                    <div className="info-t">
                      <strong>{a.name}</strong> applied for {a.department || 'Internship'}
                    </div>
                    <div className="info-s">{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ padding: '10px 0' }}>
                No recent activity
              </p>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h4>Upcoming Interviews</h4>
              <a onClick={() => onNavigate('interviews')} style={{ cursor: 'pointer' }}>
                View All
              </a>
            </div>
            {upcoming.length ? (
              upcoming.map((i, idx) => {
                const nm = i.candidateName || i.applicationId?.name || 'Candidate';
                const dept = i.applicationId?.department || i.mode || '';
                const d = new Date(i.scheduledAt || i.scheduledDate);
                return (
                  <div className="info-row" key={i._id || idx}>
                    <div className="info-av" style={{ backgroundColor: AV[idx % AV.length] }}>
                      {getInitials(nm)}
                    </div>
                    <div className="info-main">
                      <div className="info-t">{nm}</div>
                      <div className="info-s">{dept}</div>
                    </div>
                    <div className="info-meta">
                      {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <br />
                      {i.time || d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted" style={{ padding: '10px 0' }}>
                No upcoming interviews
              </p>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h4>Pending Reviews</h4>
              <a onClick={() => onNavigate('applications')} style={{ cursor: 'pointer' }}>
                View All
              </a>
            </div>
            {pending.length ? (
              pending.map((a, idx) => (
                <div className="info-row" key={a._id || idx}>
                  <div className="info-av" style={{ backgroundColor: '#f3ece2', color: '#ff4f00' }}>
                    <FileText size={16} />
                  </div>
                  <div className="info-main">
                    <div className="info-t">
                      <strong>{a.name}</strong>
                    </div>
                    <div className="info-s">{a.department || ''} Intern</div>
                  </div>
                  <div className="info-meta">
                    Applied on
                    <br />
                    {new Date(a.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ padding: '10px 0' }}>
                Nothing pending
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER MENTOR
  // ═══════════════════════════════════════════════════════════
  if (is('mentor')) {
    if (!mentorData) return null;
    const { stats, tasks, interns } = mentorData;

    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Good {greeting()}, <span>{user.name.split(' ')[0]}</span>!</h2>
            <p>You have {tasks.length} task(s) awaiting your review</p>
          </div>
          <div className="welcome-emoji">
            <BookOpen size={48} color="#f59e0b" />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><DynamicIcon name="users" size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.assignedInterns || 0}</div>
              <div className="stat-label">Assigned Interns</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon gold"><CheckSquare size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.tasks || 0}</div>
              <div className="stat-label">Tasks Assigned</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Inbox size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingReviews || 0}</div>
              <div className="stat-label">Pending Reviews</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Star size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.evaluations || 0}</div>
              <div className="stat-label">Evaluations Done</div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => onNavigate('tasks')}>
            <CheckSquare size={16} /> Review Tasks
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('evaluation')}>
            <Star size={16} /> Submit Evaluation
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('attendance')}>
            <Clock size={16} /> View Attendance
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('communication')}>
            <DynamicIcon name="message-square" size={16} /> Messages
          </button>
        </div>

        <div className="intern-list-card glass-card">
          <h4 style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>My Interns</h4>
          {interns.length ? (
            interns.slice(0, 8).map((i) => (
              <div className="intern-list-item" key={i._id}>
                <div className="avatar">{getInitials(i.name)}</div>
                <div className="intern-list-info">
                  <div className="intern-list-name">{i.name}</div>
                  <div className="intern-list-dept">
                    {i.department || 'No department'} · {i.college || ''}
                  </div>
                </div>
                <span className={`status-badge ${i.isActive !== false ? 'status-present' : 'status-absent'}`}>
                  {i.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No interns assigned yet</p>
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="glass-card" style={{ marginTop: '16px', padding: '20px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox size={18} /> Pending Task Reviews
            </h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Intern</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.title}</strong>
                      </td>
                      <td>{t.assignedTo?.name || '-'}</td>
                      <td>{timeAgo(t.submittedAt)}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('tasks')}>
                          <Eye size={12} style={{ marginRight: '4px' }} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER INTERN
  // ═══════════════════════════════════════════════════════════
  if (is('intern')) {
    if (!internData) return null;
    const { stats, tasks, announcements, todayRecord, wfh } = internData;
    const checkedIn = !!todayRecord?.checkIn;
    const checkedOut = !!todayRecord?.checkOut;

    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Good {greeting()}, <span>{user.name.split(' ')[0]}</span>! {getGreetingEmoji()}</h2>
            <p>
              {user.department || ''} Intern · {user.college || ''}
            </p>
          </div>
          <div className="welcome-emoji">
            <Briefcase size={48} color="#f59e0b" />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><CheckSquare size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalTasks || 0}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Clock size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingTasks || 0}</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><DynamicIcon name="check-circle" size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.approvedTasks || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan"><Calendar size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.presentDays || 0}/{stats.totalWorkingDays || 0}</div>
              <div className="stat-label">Attendance</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon gold"><Award size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.certificates || 0}</div>
              <div className="stat-label">Certificates</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Star size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.latestEvaluation?.overallScore || '-'}</div>
              <div className="stat-label">Latest Score</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          <div className="att-widget glass-card">
            <h4>
              <Clock size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Today's Attendance
            </h4>
            <div className="att-today-status">
              <div className="att-status-item">
                <div className="att-status-val" style={{ color: 'var(--accent-green)' }}>
                  {todayRecord?.checkIn || '--:--'}
                </div>
                <div className="att-status-lbl">Check In</div>
              </div>
              <div className="att-status-item">
                <div className="att-status-val" style={{ color: 'var(--accent-red)' }}>
                  {todayRecord?.checkOut || '--:--'}
                </div>
                <div className="att-status-lbl">Check Out</div>
              </div>
              <div className="att-status-item">
                <div className="att-status-val">
                  {todayRecord ? (
                    <span
                      className={`status-badge status-${todayRecord.status}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {todayRecord.status}
                    </span>
                  ) : (
                    <span className="text-muted">Not marked</span>
                  )}
                </div>
                <div className="att-status-lbl">Status</div>
              </div>
            </div>
            {!checkedIn ? (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      id="wfh-check"
                      style={{ width: 'auto' }}
                      checked={wfh}
                      onChange={(e) => setInternData((prev) => ({ ...prev, wfh: e.target.checked }))}
                    />{' '}
                    Work From Home today
                  </label>
                </div>
                <button className="att-check-btn" id="check-btn" onClick={markAttendance}>
                  <LogIn size={16} /> Mark Check-In
                </button>
              </>
            ) : !checkedOut ? (
              <button className="att-check-btn check-out" id="check-btn" onClick={markAttendance}>
                <LogOut size={16} /> Mark Check-Out
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--accent-green)', padding: '12px', fontWeight: '600' }}>
                Attendance Complete!
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} /> My Tasks
            </h4>
            {tasks.length ? (
              tasks.map((t) => (
                <div className="task-card" key={t._id} onClick={() => onNavigate('tasks')} style={{ cursor: 'pointer' }}>
                  <h5>{t.title}</h5>
                  <p>{t.description || ''}</p>
                  <div className="task-meta">
                    <span className={`status-badge priority-${t.priority}`}>{t.priority}</span>
                    <span className={`task-deadline ${isOverdue(t.deadline) ? 'overdue' : ''}`}>
                      {formatDate(t.deadline)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><Inbox size={32} color="var(--text-muted)" /></div>
                <h3>No tasks yet</h3>
                <p>Your mentor will assign tasks soon</p>
              </div>
            )}
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: '8px' }}
              onClick={() => onNavigate('tasks')}
            >
              View All Tasks <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>

        <div className="activity-feed glass-card" style={{ marginTop: '16px' }}>
          <h4>
            <Bell size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Announcements
          </h4>
          {announcements.length ? (
            announcements.slice(0, 4).map((a) => (
              <div className="activity-item" key={a._id}>
                <div className={`activity-dot ${a.isPinned ? 'gold' : 'blue'}`}></div>
                <div>
                  <div className="activity-text">
                    <strong>{a.title}</strong>
                    {a.isPinned && (
                      <Pin
                        size={12}
                        style={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          verticalAlign: 'middle',
                          color: 'var(--accent-gold)'
                        }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {a.content?.slice(0, 100)}...
                  </div>
                  <div className="activity-time">{timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted" style={{ padding: '12px 0' }}>
              No announcements
            </p>
          )}
        </div>
      </>
    );
  }

  return null;
}

export default Dashboard;
