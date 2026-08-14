import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import API from '../services/api';
import DynamicIcon from '../components/DynamicIcon';
import { RefreshCw, Users, UserCheck, FileText, Star, CheckSquare, Clock, CheckCircle, Award, CalendarOff } from 'lucide-react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

export function Analytics() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await API.get('/analytics/summary');
      setStats(data.stats || {});
      setCharts(data.charts || {});
    } catch (err) {
      showToast(err.message || 'Failed to load analytics summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

  // Dept chart
  const dept = charts.deptStats || [];
  const deptData = {
    labels: dept.map((d) => d._id || 'Unknown'),
    datasets: [
      {
        data: dept.map((d) => d.count),
        backgroundColor: COLORS,
        borderRadius: 6
      }
    ]
  };

  const deptOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.08)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      }
    }
  };

  // App status chart
  const apps = charts.appStats || [];
  const appStatusData = {
    labels: apps.map((a) => (a._id || '').replace(/_/g, ' ')),
    datasets: [
      {
        data: apps.map((a) => a.count),
        backgroundColor: COLORS,
        borderWidth: 0
      }
    ]
  };

  const appStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  // Monthly Applications chart
  const monthly = charts.monthlyApps || [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {
    labels: monthly.map((m) => {
      const monthNum = m?._id?.month;
      const monthName = (monthNum && monthNum >= 1 && monthNum <= 12) ? months[monthNum - 1] : 'Unknown';
      const year = m?._id?.year || '';
      return `${monthName} ${year}`.trim();
    }),
    datasets: [
      {
        label: 'Applications',
        data: monthly.map((m) => m.count),
        borderColor: '#4f8ef7',
        backgroundColor: 'rgba(79,142,247,0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f8ef7'
      }
    ]
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.08)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      }
    }
  };

  // Tasks chart
  const tasks = charts.taskStats || [];
  const tasksData = {
    labels: tasks.map((t) => (t._id || '').replace(/_/g, ' ')),
    datasets: [
      {
        data: tasks.map((t) => t.count),
        backgroundColor: COLORS,
        borderWidth: 0
      }
    ]
  };

  const tasksOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  const activeInternRate = stats.totalInterns ? Math.round((stats.activeInterns / stats.totalInterns) * 100) : 0;
  const taskCompletionRate = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  
  const selectedCount = (charts.appStats || []).find((a) => a._id === 'selected')?.count || 0;
  const selectionRate = stats.totalApplications ? Math.round((selectedCount / stats.totalApplications) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Analytics & Reports</h2>
          <p>Platform-wide internship statistics and insights</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAnalytics}>
          <RefreshCw size={16} style={{ marginRight: '4px' }} /> Refresh
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalInterns || 0}</div>
            <div className="stat-label">Total Interns</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <UserCheck size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeInterns || 0}</div>
            <div className="stat-label">Active Interns</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">
            <FileText size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalApplications || 0}</div>
            <div className="stat-label">Applications</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Star size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.avgEvaluationScore || '-'}</div>
            <div className="stat-label">Avg Eval Score</div>
          </div>
        </div>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card glass-card">
          <h4>Department Distribution</h4>
          <div className="chart-wrap" style={{ position: 'relative', height: '240px' }}>
            <Bar data={deptData} options={deptOptions} />
          </div>
        </div>
        <div className="chart-card glass-card">
          <h4>Application Status Breakdown</h4>
          <div className="chart-wrap" style={{ position: 'relative', height: '240px' }}>
            <Doughnut data={appStatusData} options={appStatusOptions} />
          </div>
        </div>
      </div>
      
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
        <div className="chart-card glass-card">
          <h4>Monthly Applications (Last 6 Months)</h4>
          <div className="chart-wrap" style={{ position: 'relative', height: '240px' }}>
            <Line data={monthlyData} options={monthlyOptions} />
          </div>
        </div>
        <div className="chart-card glass-card">
          <h4>Task Status Overview</h4>
          <div className="chart-wrap" style={{ position: 'relative', height: '240px' }}>
            <Doughnut data={tasksData} options={tasksOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2" style={{ marginTop: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Key Metrics</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Active Intern Rate</span>
                <strong style={{ color: 'var(--accent-green)' }}>{activeInternRate}%</strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${activeInternRate}%`, background: 'var(--accent-green)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Task Completion Rate</span>
                <strong style={{ color: 'var(--accent-blue)' }}>{taskCompletionRate}%</strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${taskCompletionRate}%`, background: 'var(--accent-blue)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Application Selection Rate</span>
                <strong style={{ color: 'var(--accent-gold)' }}>{selectionRate}%</strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${selectionRate}%`, background: 'var(--accent-gold)' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Summary Counts</h4>
          {[
            { label: 'Total Tasks', value: stats.totalTasks || 0, icon: 'check-square' },
            { label: 'Pending Tasks', value: stats.pendingTasks || 0, icon: 'clock' },
            { label: 'Completed Tasks', value: stats.completedTasks || 0, icon: 'check-circle' },
            { label: 'Certificates Issued', value: stats.totalCertificates || 0, icon: 'award' },
            { label: 'Pending Leaves', value: stats.pendingLeaves || 0, icon: 'calendar-off' },
            { label: 'Today Present', value: stats.todayAttendance || 0, icon: 'user-check' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}
              >
                <DynamicIcon name={item.icon} size={16} />
                {item.label}
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Analytics;
