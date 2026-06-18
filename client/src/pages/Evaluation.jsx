import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, statusBadge } from '../utils/helpers';
import { Radar, Line } from 'react-chartjs-2';
import { Plus, X, Star } from 'lucide-react';

const PARAMS = ['communication', 'teamwork', 'leadership', 'discipline', 'technical', 'taskCompletion'];
const LABELS = {
  communication: 'Communication',
  teamwork: 'Teamwork',
  leadership: 'Leadership',
  discipline: 'Discipline',
  technical: 'Technical Skills',
  taskCompletion: 'Task Completion'
};

export function Evaluation() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [evals, setEvals] = useState([]);
  const [interns, setInterns] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mentor Selection State
  const [selectedIntern, setSelectedIntern] = useState('');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    internId: '',
    week: '',
    period: '',
    ratings: {
      communication: 5,
      teamwork: 5,
      leadership: 5,
      discipline: 5,
      technical: 5,
      taskCompletion: 5
    },
    comments: '',
    strengths: '',
    improvements: '',
    recommendation: 'good'
  });

  const isIntern = is('intern');

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      if (isIntern) {
        const [evalsData, progressData] = await Promise.all([
          API.get('/evaluations'),
          API.get(`/evaluations/progress/${user._id}`)
        ]);
        setEvals(evalsData.evaluations || []);
        setProgress(progressData.progress || null);
      } else {
        const [evalsData, internsData] = await Promise.all([
          API.get('/evaluations'),
          API.get('/users?role=intern')
        ]);
        setEvals(evalsData.evaluations || []);
        setInterns(internsData.users || []);
        setProgress(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load evaluations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInternFilterChange = async (internId) => {
    setSelectedIntern(internId);
    if (!internId) {
      setProgress(null);
      return;
    }
    try {
      const data = await API.get(`/evaluations/progress/${internId}`);
      setProgress(data.progress || null);
    } catch (err) {
      showToast(err.message || 'Failed to fetch intern performance progress', 'error');
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [isIntern]);

  const handleOpenCreateModal = () => {
    setFormData({
      internId: '',
      week: '',
      period: '',
      ratings: {
        communication: 5,
        teamwork: 5,
        leadership: 5,
        discipline: 5,
        technical: 5,
        taskCompletion: 5
      },
      comments: '',
      strengths: '',
      improvements: '',
      recommendation: 'good'
    });
    setCreateModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (param, val) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [param]: parseFloat(val) || 5
      }
    }));
  };

  const getOverallScore = () => {
    const vals = Object.values(formData.ratings);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return avg.toFixed(1);
  };

  const handleSubmitEval = async (e) => {
    e.preventDefault();
    if (!formData.internId || !formData.week) {
      showToast('Intern and Week Number are required', 'error');
      return;
    }
    try {
      await API.post('/evaluations', formData);
      showToast('Evaluation submitted!', 'success');
      setCreateModalOpen(false);
      fetchBaseData();
      if (selectedIntern) {
        handleInternFilterChange(selectedIntern);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit evaluation', 'error');
    }
  };

  // Setup charts data
  const getRadarData = () => {
    const defaultData = [0, 0, 0, 0, 0, 0];
    const averages = progress?.averages || {};
    
    // map averages to array
    const dataVals = PARAMS.map(p => averages[p] || 0);

    return {
      labels: ['Communication', 'Teamwork', 'Leadership', 'Discipline', 'Technical', 'Task Completion'],
      datasets: [
        {
          label: 'Avg Score',
          data: progress ? dataVals : defaultData,
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.2)',
          pointBackgroundColor: '#4f8ef7'
        }
      ]
    };
  };

  const getTrendData = () => {
    const weeks = progress?.weeks || [];
    return {
      labels: weeks.map((w) => `Week ${w.week}`),
      datasets: [
        {
          label: 'Overall',
          data: weeks.map((w) => w.overall),
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4f8ef7'
        }
      ]
    };
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#94a3b8', font: { size: 11, family: "'Inter', sans-serif" } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER INTERN
  // ═══════════════════════════════════════════════════════════
  if (isIntern) {
    const avg = progress?.averages || {};
    const overall = progress?.overallAverage || 0;

    return (
      <>
        <div className="page-header">
          <div>
            <h2>My Evaluations</h2>
            <p>View your performance reviews and progress</p>
          </div>
        </div>

        <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '20px' }}>Overall Performance</h4>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(var(--accent-blue) ${overall * 36}deg, var(--border-color) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{overall}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/10</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>Average Score across {evals.length} evaluation(s)</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {Object.entries(avg).map(([k, v]) => (
                <div key={k}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                    <strong style={{ color: 'var(--accent-blue)' }}>{v}</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${v * 10}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Performance Radar</h4>
            <div style={{ height: '280px' }}>
              <Radar data={getRadarData()} options={radarOptions} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {evals.length ? (
            evals.map((e) => (
              <div className="glass-card" style={{ padding: '20px' }} key={e._id}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>
                    Week {e.week} — {e.period || ''}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span dangerouslySetInnerHTML={{ __html: statusBadge(e.recommendation || 'good') }} />
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: `conic-gradient(var(--accent-blue) ${e.overallScore * 36}deg, var(--border-color) 0)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: 'var(--accent-blue)'
                        }}
                      >
                        {e.overallScore}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                  {Object.entries(e.ratings || {}).map(([k, v]) => (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', textAlign: 'center' }} key={k}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{v}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {k.replace(/([A-Z])/g, ' $1')}
                      </div>
                    </div>
                  ))}
                </div>
                {e.comments && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    💬 {e.comments}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  By {e.mentorId?.name || 'Mentor'} · {formatDate(e.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No evaluations yet</h3>
              <p>Your mentor will evaluate your performance weekly</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER MENTOR / HR / ADMIN
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="page-header">
        <div>
          <h2>Performance Evaluations</h2>
          <p>Weekly intern performance reviews and KPI tracking</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> New Evaluation
        </button>
      </div>

      <div className="filter-bar glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <select
          id="eval-intern-filter"
          style={{ width: '220px' }}
          value={selectedIntern}
          onChange={(e) => handleInternFilterChange(e.target.value)}
        >
          <option value="">All Interns</option>
          {interns.map((i) => (
            <option key={i._id} value={i._id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Performance Radar</h4>
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radar data={getRadarData()} options={radarOptions} />
          </div>
          {!selectedIntern && (
            <p id="radar-hint" style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Select an intern above to view their radar chart
            </p>
          )}
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Score Trend</h4>
          <div style={{ height: '280px' }}>
            {selectedIntern && progress?.weeks?.length ? (
              <Line data={getTrendData()} options={trendOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-container glass-card">
        <table>
          <thead>
            <tr>
              <th>Intern</th>
              <th>Week</th>
              <th>Comm</th>
              <th>Team</th>
              <th>Lead</th>
              <th>Disc</th>
              <th>Tech</th>
              <th>Task</th>
              <th>Overall</th>
              <th>Rec.</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {evals.length ? (
              evals.map((e) => (
                <tr key={e._id}>
                  <td>
                    <strong>{e.internId?.name || '-'}</strong>
                  </td>
                  <td>Week {e.week}</td>
                  <td>{e.ratings?.communication || '-'}</td>
                  <td>{e.ratings?.teamwork || '-'}</td>
                  <td>{e.ratings?.leadership || '-'}</td>
                  <td>{e.ratings?.discipline || '-'}</td>
                  <td>{e.ratings?.technical || '-'}</td>
                  <td>{e.ratings?.taskCompletion || '-'}</td>
                  <td>
                    <strong style={{ color: 'var(--accent-blue)' }}>{e.overallScore || '-'}</strong>
                  </td>
                  <td>
                    <span dangerouslySetInnerHTML={{ __html: statusBadge(e.recommendation || 'good') }} />
                  </td>
                  <td>{formatDate(e.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No evaluations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Evaluation Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>New Performance Evaluation</h3>
              <button className="modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitEval}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Intern *</label>
                      <select
                        name="internId"
                        value={formData.internId}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select intern</option>
                        {interns.map((i) => (
                          <option key={i._id} value={i._id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Week Number *</label>
                      <input
                        type="number"
                        name="week"
                        required
                        min="1"
                        max="52"
                        placeholder="e.g. 1"
                        value={formData.week}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Period</label>
                    <input
                      type="text"
                      name="period"
                      placeholder="e.g. Week 1: Jun 1-7"
                      value={formData.period}
                      onChange={handleFormChange}
                    />
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Performance Ratings (1-10)</h4>
                  {PARAMS.map((p) => (
                    <div className="eval-param" key={p} style={{ marginBottom: '8px' }}>
                      <div className="eval-param-header" style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="eval-param-label">{LABELS[p]}</span>
                        <span className="eval-param-score" id={`score-${p}`} style={{ fontWeight: '600' }}>
                          {formData.ratings[p]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.ratings[p]}
                        onChange={(e) => handleSliderChange(p, e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  ))}

                  <div
                    style={{
                      textTransform: 'none',
                      textAlign: 'center',
                      padding: '12px',
                      background: 'rgba(79,142,247,0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(79,142,247,0.2)'
                    }}
                  >
                    Overall Score: <strong id="overall-score" style={{ fontSize: '1.3rem', color: 'var(--accent-blue)' }}>{getOverallScore()}</strong>/10
                  </div>

                  <div className="form-group">
                    <label>Comments</label>
                    <textarea
                      name="comments"
                      rows="3"
                      placeholder="General feedback..."
                      value={formData.comments}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Strengths</label>
                      <textarea
                        name="strengths"
                        rows="2"
                        placeholder="Key strengths..."
                        value={formData.strengths}
                        onChange={handleFormChange}
                      ></textarea>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Areas for Improvement</label>
                      <textarea
                        name="improvements"
                        rows="2"
                        placeholder="What to improve..."
                        value={formData.improvements}
                        onChange={handleFormChange}
                      ></textarea>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Recommendation</label>
                    <select name="recommendation" value={formData.recommendation} onChange={handleFormChange}>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="needs_improvement">Needs Improvement</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Star size={12} style={{ marginRight: '4px' }} /> Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Evaluation;
