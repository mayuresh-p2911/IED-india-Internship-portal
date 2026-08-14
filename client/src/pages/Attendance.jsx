import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { statusBadge } from '../utils/helpers';
import {
  Clock,
  CheckCircle,
  XCircle,
  Home,
  CalendarOff,
  Calendar,
  MapPin,
  LogIn,
  LogOut,
  Download,
  Search
} from 'lucide-react';

function AttendanceCalendar({ year, month, records }) {
  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.date] = r.status;
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells = [];
  // Empty prepending cells for calendar start day offsets
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="att-day" style={{ visibility: 'hidden' }}></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = recordMap[dateStr];
    const dow = new Date(year, month, d).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;

    let cls = isFuture ? 'future' : isWeekend ? 'weekend' : (status || 'absent');
    if (isToday) cls += ' today';

    const label =
      status === 'present' ? 'P' : status === 'wfh' ? 'W' : status === 'on_leave' ? 'L' : status === 'late' ? 'L' : d;

    cells.push(
      <div key={`day-${d}`} className={`att-day ${cls}`} title={`${dateStr}${status ? ' - ' + status : ''}`}>
        {isFuture || isWeekend ? d : label}
      </div>
    );
  }

  return (
    <div className="att-calendar">
      {days.map((d) => (
        <div key={d} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' }}>
          {d}
        </div>
      ))}
      {cells}
    </div>
  );
}

export function Attendance({ onNavigate }) {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [summary, setSummary] = useState({});
  const [records, setRecords] = useState([]);

  // Admin state
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Date/Month state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  
  // Intern check-in states
  const [wfh, setWfh] = useState(false);

  const isIntern = is('intern');

  const fetchInternData = async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split('-');
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA');
      const tz = now.getTimezoneOffset();
      const [todayData, reportData] = await Promise.all([
        API.get(`/attendance/today?date=${localDate}&tz=${tz}`),
        API.get(`/attendance/report?month=${m}&year=${y}`)
      ]);
      setTodayRecord(todayData.record || null);
      setSummary(reportData.summary || {});
      setRecords(reportData.records || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch attendance details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split('-');
      let url = `/attendance?month=${m}&year=${y}`;
      if (selectedIntern) {
        url += `&internId=${selectedIntern}`;
      }
      const [usersData, reportData] = await Promise.all([
        API.get('/users?role=intern'),
        API.get(url)
      ]);
      setInterns(usersData.users || []);
      setRecords(reportData.records || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initAttendance = () => {
    if (isIntern) {
      fetchInternData();
    } else {
      fetchAdminData();
    }
  };

  useEffect(() => {
    initAttendance();
  }, [isIntern, selectedMonth, selectedIntern]);

  const handleMarkCheckIn = async () => {
    let location = {};
    if (navigator.geolocation) {
      try {
        location = await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
            (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => res({}),
            { timeout: 5000 }
          );
        });
      } catch {}
    }
    try {
      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const clientDate = now.toLocaleDateString('en-CA');
      const timezoneOffset = now.getTimezoneOffset();
      const result = await API.post('/attendance/mark', {
        type: wfh ? 'wfh' : 'office',
        location,
        clientTime,
        clientDate,
        timezoneOffset
      });
      showToast(result.message, 'success');
      fetchInternData();
    } catch (err) {
      showToast(err.message || 'Failed to check-in', 'error');
    }
  };

  const handleMarkCheckOut = async () => {
    try {
      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const clientDate = now.toLocaleDateString('en-CA');
      const timezoneOffset = now.getTimezoneOffset();
      const result = await API.post('/attendance/mark', {
        clientTime,
        clientDate,
        timezoneOffset
      });
      showToast(result.message, 'success');
      fetchInternData();
    } catch (err) {
      showToast(err.message || 'Failed to check-out', 'error');
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="loading" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER INTERN VIEW
  // ═══════════════════════════════════════════════════════════
  if (isIntern) {
    const checkedIn = !!todayRecord?.checkIn;
    const checkedOut = !!todayRecord?.checkOut;
    const [currY, currM] = selectedMonth.split('-').map(Number);

    return (
      <>
        <div className="page-header">
          <div>
            <h2>Attendance</h2>
            <p>Track your daily attendance and view monthly history</p>
          </div>
          <button className="btn btn-secondary" onClick={() => onNavigate('leaves')}>
            <CalendarOff size={16} /> Apply Leave
          </button>
        </div>

        <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
          <div className="att-widget glass-card">
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Today —{' '}
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
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
                    <span dangerouslySetInnerHTML={{ __html: statusBadge(todayRecord.status) }} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Not marked</span>
                  )}
                </div>
                <div className="att-status-lbl">Status</div>
              </div>
            </div>
            {!checkedIn ? (
              <>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={wfh}
                    onChange={(e) => setWfh(e.target.checked)}
                    style={{ width: 'auto' }}
                  />{' '}
                  Working From Home today
                </label>
                <button className="att-check-btn" onClick={handleMarkCheckIn}>
                  <LogIn size={16} style={{ marginRight: '6px' }} /> Mark Check-In
                </button>
              </>
            ) : !checkedOut ? (
              <button className="att-check-btn check-out" onClick={handleMarkCheckOut}>
                <LogOut size={16} style={{ marginRight: '6px' }} /> Mark Check-Out
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--accent-green)', fontWeight: '600' }}>
                Attendance Complete for Today!
              </div>
            )}
            {todayRecord?.location?.lat && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                <MapPin size={12} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />{' '}
                Location recorded
              </p>
            )}
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>This Month Summary</h4>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-card">
                <div className="stat-icon green">
                  <CheckCircle size={18} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{summary.present || 0}</div>
                  <div className="stat-label">Present</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">
                  <XCircle size={18} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{summary.absent || 0}</div>
                  <div className="stat-label">Absent</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon cyan">
                  <Home size={18} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{summary.wfh || 0}</div>
                  <div className="stat-label">WFH</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <CalendarOff size={18} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{summary.on_leave || 0}</div>
                  <div className="stat-label">On Leave</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Monthly Calendar
            </h4>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '160px', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
          <AttendanceCalendar year={currY} month={currM - 1} records={records} />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px', fontSize: '0.8rem' }}>
            <span>
              <span className="att-day present" style={{ display: 'inline-block', width: '16px', height: '16px', textAlign: 'center', marginRight: '4px' }}>
                P
              </span>{' '}
              Present
            </span>
            <span>
              <span className="att-day absent" style={{ display: 'inline-block', width: '16px', height: '16px', textAlign: 'center', marginRight: '4px' }}>
                A
              </span>{' '}
              Absent
            </span>
            <span>
              <span className="att-day wfh" style={{ display: 'inline-block', width: '16px', height: '16px', textAlign: 'center', marginRight: '4px' }}>
                W
              </span>{' '}
              WFH
            </span>
            <span>
              <span className="att-day on_leave" style={{ display: 'inline-block', width: '16px', height: '16px', textAlign: 'center', marginRight: '4px' }}>
                L
              </span>{' '}
              Leave
            </span>
          </div>
        </div>

        <div className="table-container glass-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {records.length ? (
                records.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{r.date}</strong>
                    </td>
                    <td>{r.checkIn || '-'}</td>
                    <td>{r.checkOut || '-'}</td>
                    <td>
                      <span className="status-badge" style={{ textTransform: 'capitalize' }}>
                        {r.type || '-'}
                      </span>
                    </td>
                    <td>
                      <span dangerouslySetInnerHTML={{ __html: statusBadge(r.status) }} />
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {r.location?.lat ? (
                        <>
                          <MapPin size={12} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                          {r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No records for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER ADMIN / MENTOR / HR VIEW
  // ═══════════════════════════════════════════════════════════
  const filteredRecords = records.filter(r => {
    if (!searchQuery.trim()) return true;
    const name = r.internId?.name?.toLowerCase() || '';
    const dept = r.internId?.department?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Attendance Management</h2>
          <p>Monitor intern attendance across the organisation</p>
        </div>
        <button className="btn btn-secondary" onClick={() => showToast('Export feature coming soon', 'info')}>
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="filter-bar glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div className="search-input" style={{ display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search intern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedIntern}
          onChange={(e) => setSelectedIntern(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">All Interns</option>
          {interns.map((i) => (
            <option key={i._id} value={i._id}>
              {i.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ width: '160px' }}
        />
      </div>

      <div className="stats-grid" id="att-summary" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{records.filter((r) => r.status === 'present').length}</div>
            <div className="stat-label">Present Days</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <XCircle size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{records.filter((r) => r.status === 'absent').length}</div>
            <div className="stat-label">Absent Days</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Home size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{records.filter((r) => r.status === 'wfh').length}</div>
            <div className="stat-label">WFH Days</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <CalendarOff size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{records.filter((r) => r.status === 'on_leave').length}</div>
            <div className="stat-label">On Leave</div>
          </div>
        </div>
      </div>

      <div className="table-container glass-card" id="att-table">
        <table>
          <thead>
            <tr>
              <th>Intern</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{r.internId?.name || '-'}</strong>
                    <br />
                    <small className="text-muted">{r.internId?.department || ''}</small>
                  </td>
                  <td>{r.date}</td>
                  <td>{r.checkIn || '-'}</td>
                  <td>{r.checkOut || '-'}</td>
                  <td>
                    <span className="status-badge" style={{ textTransform: 'capitalize' }}>
                      {r.type || '-'}
                    </span>
                  </td>
                  <td>
                    <span dangerouslySetInnerHTML={{ __html: statusBadge(r.status) }} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Attendance;
