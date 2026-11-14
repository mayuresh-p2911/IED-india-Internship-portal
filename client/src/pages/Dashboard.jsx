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
  Pin,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Lock,
  Download,
  ExternalLink,
  QrCode,
  Sparkles
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
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA');
      const tz = now.getTimezoneOffset();
      const [statsData, tasksData, announcementsData, todayData] = await Promise.all([
        API.get('/analytics/intern'),
        API.get('/tasks'),
        API.get('/announcements'),
        API.get(`/attendance/today?date=${localDate}&tz=${tz}`)
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
      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const clientDate = now.toLocaleDateString('en-CA');
      const timezoneOffset = now.getTimezoneOffset();
      const type = internData?.wfh ? 'wfh' : 'office';
      const result = await API.post('/attendance/mark', {
        type,
        location,
        clientTime,
        clientDate,
        timezoneOffset
      });
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
    if (!adminData) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Failed to load dashboard data.</p>
          <button className="btn btn-primary" onClick={initDashboard} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      );
    }
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
    const getMonthLabel = (m) => {
      const monthNum = m?._id?.month;
      return (monthNum && monthNum >= 1 && monthNum <= 12) ? months[monthNum - 1] : 'Unknown';
    };
    const barData = {
      labels: monthlyApps.map(getMonthLabel),
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
      labels: monthlyApps.map(getMonthLabel),
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
    if (!mentorData) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Failed to load mentor dashboard data.</p>
          <button className="btn btn-primary" onClick={initDashboard} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      );
    }
    const { stats, tasks, interns } = mentorData;

    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Good {greeting()}, <span>{(user?.name || 'there').split(' ')[0]}</span>!</h2>
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
    if (!internData) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Failed to load intern dashboard data.</p>
          <button className="btn btn-primary" onClick={initDashboard} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      );
    }
    const { stats, tasks, announcements, todayRecord, wfh } = internData;
    const checkedIn = !!todayRecord?.checkIn;
    const checkedOut = !!todayRecord?.checkOut;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Verified Referral Channel Banner */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Verified Referral Channel
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '4px' }}>
              Tier-1 Priority Track
            </span>
            <span style={{ color: '#1e3a8a', fontWeight: 500 }}>
              Referred by <strong>Priya Verma</strong> (Referral ID: REF-8842) — Fast-Track Matriculation Active
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7' }}>
            Partner Benefit: 100% Fee Offset Applied
          </div>
        </div>

        {/* Candidate Profile Header Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'linear-gradient(135deg, #022654, #03377A)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                {getInitials(user?.name || 'Aarav Sharma')}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{user?.name || 'Aarav Sharma'}</h2>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px' }}>
                    • Enrolled & Verified
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                  {user?.college || 'National Institute of Technology, Trichy'} • <strong style={{ color: '#03377A' }}>{user?.department || 'Full Stack Engineering (AI/ML Track)'}</strong> • 6 Months Cohort
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  <span>UID: <strong style={{ color: '#0f172a' }}>{user?.rollNo || 'STU-2025-IN-9812'}</strong></span>
                  <span>Application ID: <strong style={{ color: '#0f172a' }}>{user?.applicationId || 'IED-APP-2025-09142'}</strong></span>
                  <span>Cohort Term: <strong style={{ color: '#0f172a' }}>July 15, 2025 – January 15, 2026</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('onboarding')}>
                <FileText size={14} /> Receipt
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('onboarding')}>
                View Offer Letter
              </button>
            </div>
          </div>

          {/* 3 Metric Pills in Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>FEE & PAYMENT STATUS</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#047857', marginTop: '3px' }}>Paid (₹2,948.82 via Razorpay)</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Txn ID: pay_Pq981LxM8921a</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ACADEMIC ACCREDITATION</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#03377A', marginTop: '3px' }}>IED Enterprise AI Credential</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tier-1 CEU Transferable Credits</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>COHORT CLOCK</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginTop: '3px' }}>Begins July 15, 2025</div>
              <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>T-Minus Orientation Scheduled</div>
            </div>
          </div>
        </div>

        {/* Immediate Action Required Banner */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '5px solid #f59e0b', borderRadius: '8px', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Immediate Action Required
              </span>
              <span style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 600 }}>Step 3 of 6 Pending</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#78350f', margin: '6px 0 2px' }}>
              Onboarding Incomplete (2/6 Steps Completed)
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e' }}>
              To secure your pod slot and access your GitHub Enterprise organization repositories, submit your college bonafide letter and complete NDA attestation.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('onboarding')} style={{ background: '#022654', borderColor: '#022654', fontSize: '0.85rem' }}>
            Complete Onboarding Checklist <ArrowRight size={16} />
          </button>
        </div>

        {/* 4 KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ATTENDANCE LOG</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Not Started</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
              {stats.presentDays || 0} / 120 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Days</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>Required Minimum: 100% Policy</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ASSIGNED TASKS</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>Sprint 0</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
              {stats.pendingTasks || 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Active / {stats.approvedTasks || 0} Completed</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Sprint 1 backlog unlocks following orientation.</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>CURRICULUM CEU</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>Pre-Cohort Ready</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
              0% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Modules</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>AI/ML Foundation & Setup module available now.</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>LEGAL & CONTRACT</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>Counter-Signed</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
              Ready <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>PDF Executed</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Digital certificate stamp verified with registrar.</div>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Matriculation Action Items */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Matriculation Action Items & Next Steps</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Tasks required prior to July 15 Cohort Kickoff</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>3 Tasks Outstanding</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Item 1 */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e3a8a' }}>Upload Bonafide / College ID</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>Action Required</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px' }}>
                        Upload institutional proof of enrollment from NIT Trichy signed by HOD or Academic Dean.
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onNavigate('onboarding')}>
                    Upload Document
                  </button>
                </div>

                {/* Item 2 */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                      <Lock size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>Schedule 1-on-1 Mentor Baseline Interview</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Locked</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                        30-minute diagnostic session with Dr. Vikramaditya Rao to configure your custom project pod and sprint goals.
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" disabled>
                    Locked
                  </button>
                </div>

                {/* Item 3 */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03377A', flexShrink: 0 }}>
                      @
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>Join Slack Workspace & GitHub Enterprise Pod</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>Invite Dispatched</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                        Invitation sent to {user?.email || 'aarav.sharma@techuni.edu.in'}. Connect your single-sign-on credentials.
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.open('https://github.com', '_blank')}>
                    Accept Invite
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Punch-In Widget */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#03377A" /> Daily Attendance Ledger
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{todayRecord?.checkIn || '--:--'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Check In</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>{todayRecord?.checkOut || '--:--'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Check Out</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: todayRecord ? '#059669' : '#64748b', marginTop: '4px' }}>
                    {todayRecord ? todayRecord.status.toUpperCase() : 'PENDING'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Status</div>
                </div>
              </div>

              {!checkedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={wfh}
                      onChange={(e) => setInternData((prev) => ({ ...prev, wfh: e.target.checked }))}
                    /> Work From Home
                  </label>
                  <button className="btn btn-primary btn-sm" onClick={markAttendance}>
                    <LogIn size={14} /> Mark Check-In
                  </button>
                </div>
              ) : !checkedOut ? (
                <button className="btn btn-danger btn-sm btn-full" onClick={markAttendance}>
                  <LogOut size={14} /> Mark Check-Out
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                  ✓ Today's Attendance Verified
                </div>
              )}
            </div>

            {/* Cohort Progression Roadmap */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Cohort Progression Roadmap</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>6 Months / 24 Sprints Structured Engineering Cadence</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid #e2e8f0', paddingLeft: '16px', marginLeft: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>PHASE 01 • JULY 15 – AUGUST 15</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginTop: '2px' }}>Foundational Systems & Distributed Architecture</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Core backend pipelines, Microservices setup, Dockerized local pods, and CI/CD foundations.</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PHASE 02 • AUGUST 16 – OCTOBER 15</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>AI Inference Engines & ML Model Orchestration</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Vector DBs, RAG implementation, fine-tuning LLMs with enterprise governance, and PyTorch deployment.</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PHASE 03 • OCTOBER 16 – JANUARY 15</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>Capstone Enterprise System & Placement Immersion</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Production load-testing, code security audits, mentor evaluation, and industry hiring fairs.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Assigned Mentor Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ASSIGNED MENTOR</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>• Verified Lead</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, #03377A, #0284c7)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  VR
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Dr. Vikramaditya Rao</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>AI Tech Lead & Principal Architect</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ex-Google Research • Fellow IED India</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '0.75rem', color: '#475569', marginBottom: '14px' }}>
                <div>1-on-1 Office Hours: <strong style={{ color: '#0f172a' }}>Tuesdays & Thursdays</strong></div>
                <div style={{ marginTop: '3px' }}>Pod Assignment: <strong style={{ color: '#03377A' }}>Pod Alpha-9 (AI/ML)</strong></div>
              </div>

              <button className="btn btn-secondary btn-full btn-sm" onClick={() => onNavigate('interviews')} style={{ justifyContent: 'center' }}>
                Book Advising Slot
              </button>
            </div>

            {/* Noticeboard */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>Noticeboard</h4>
                <span style={{ fontSize: '0.72rem', color: '#03377A', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('announcements')}>View All</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>ORIENTATION • JULY 15</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginTop: '2px' }}>Virtual Convocation & Keynote by Board of Governors</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Access links for the institutional orientation webinar will be released via your student docket.</div>
                </div>

                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>CLOUD CREDITS</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginTop: '2px' }}>AWS & HuggingFace Enterprise GPU Voucher Allocation</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Each student receives $500 monthly compute credits upon bonafide completion.</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>POLICY UPDATE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginTop: '2px' }}>Code of Ethics & IP Protection Agreement v4.2</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>All repositories developed inside IED pods remain dual-licensed under educational academic terms.</div>
                </div>
              </div>
            </div>

            {/* Verifiable Ledger Badge */}
            <div style={{ background: 'linear-gradient(135deg, #021a3b 0%, #03377A 100%)', color: '#ffffff', borderRadius: '10px', padding: '18px', boxShadow: '0 4px 14px rgba(2, 26, 59, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#93c5fd' }}>VERIFIABLE LEDGER</span>
                <QrCode size={18} color="#93c5fd" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Cryptographic Credentials</div>
              <div style={{ fontSize: '0.72rem', color: '#bfdbfe', marginTop: '4px', lineHeight: 1.4 }}>
                Your academic records are anchored on the IED tamper-proof registry for instant employer verification.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#93c5fd', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                <span>Status: Key Generated</span>
                <span>Ledger Block #89342</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Referral partners use a dedicated dashboard component — this is a fallback
  if (is('referral_partner')) {
    return null;
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p className="text-muted">No dashboard available for role: {user?.role || 'unknown'}</p>
    </div>
  );
}

export default Dashboard;
