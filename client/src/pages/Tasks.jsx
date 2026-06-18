import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, getInitials, isOverdue, priorityBadge, statusBadge } from '../utils/helpers';
import { Plus, Play, Check, X, Send } from 'lucide-react';

const COLS = [
  { key: 'todo', label: 'To Do', color: 'var(--accent-blue)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent-orange)' },
  { key: 'submitted', label: 'Submitted', color: 'var(--accent-purple)' },
  { key: 'approved', label: 'Approved', color: 'var(--accent-green)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--accent-red)' }
];

export function Tasks() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [submissionNote, setSubmissionNote] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState(8);

  // Task creation state
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    department: '',
    priority: 'medium',
    deadline: ''
  });

  const canCreate = is('admin', 'hr', 'mentor');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await API.get('/tasks');
      setTasks(data.tasks || []);
    } catch (err) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const res = await API.get('/users?role=intern');
      setInterns(res.users || []);
    } catch (err) {
      showToast(err.message || 'Failed to load interns list', 'error');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenDetails = (task) => {
    setActiveTask(task);
    setSubmissionNote('');
    setReviewFeedback('');
    setReviewScore(8);
    setDetailModalOpen(true);
  };

  const handleOpenCreate = async () => {
    await fetchInterns();
    setCreateData({
      title: '',
      description: '',
      assignedTo: '',
      department: '',
      priority: 'medium',
      deadline: ''
    });
    setCreateModalOpen(true);
  };

  const handleCreateTaskChange = (e) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createData.title || !createData.assignedTo || !createData.deadline) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await API.post('/tasks', createData);
      showToast('Task created successfully!', 'success');
      setCreateModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to create task', 'error');
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!submissionNote.trim()) {
      showToast('Please add a submission note', 'error');
      return;
    }
    try {
      await API.patch(`/tasks/${activeTask._id}/submit`, { submissionNote });
      showToast('Task submitted for review!', 'success');
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to submit task', 'error');
    }
  };

  const handleReviewTask = async (status) => {
    try {
      await API.patch(`/tasks/${activeTask._id}/review`, {
        status,
        feedback: reviewFeedback,
        completionScore: reviewScore
      });
      showToast(`Task ${status}!`, status === 'approved' ? 'success' : 'info');
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to review task', 'error');
    }
  };

  const handleStartTask = async () => {
    try {
      await API.put(`/tasks/${activeTask._id}`, { status: 'in_progress' });
      showToast('Task updated', 'success');
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to start task', 'error');
    }
  };

  const filteredTasks = priorityFilter
    ? tasks.filter((t) => t.priority === priorityFilter)
    : tasks;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Task Management</h2>
          <p>{is('intern') ? 'View and submit your assigned tasks' : 'Assign and review intern tasks'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            id="task-filter-priority"
            style={{ width: '140px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="kanban-board" id="kanban-board">
        {COLS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div className="kanban-col" data-status={col.key} key={col.key}>
              <div className="kanban-col-header">
                <span className="kanban-col-title" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-cards" id={`col-${col.key}`}>
                {colTasks.length ? (
                  colTasks.map((t) => (
                    <div className="task-card" key={t._id} onClick={() => handleOpenDetails(t)}>
                      <h5>{t.title}</h5>
                      <p>
                        {(t.description || '').slice(0, 80)}
                        {t.description?.length > 80 ? '...' : ''}
                      </p>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span dangerouslySetInnerHTML={{ __html: priorityBadge(t.priority) }} />
                        {t.department && <span className="status-badge" style={{ fontSize: '0.65rem' }}>{t.department}</span>}
                      </div>
                      <div className="task-meta">
                        <span
                          className={`task-deadline ${
                            isOverdue(t.deadline) && !['approved', 'rejected'].includes(t.status) ? 'overdue' : ''
                          }`}
                        >
                          {formatDate(t.deadline)}
                        </span>
                        <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                          {getInitials(t.assignedTo?.name || '?')}
                        </div>
                      </div>
                      {t.assignedTo?.name && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {t.assignedTo.name}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {detailModalOpen && activeTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Task: {activeTask.title}</h3>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span dangerouslySetInnerHTML={{ __html: statusBadge(activeTask.status) }} />
                  <span dangerouslySetInnerHTML={{ __html: priorityBadge(activeTask.priority) }} />
                  {activeTask.department && <span className="status-badge">{activeTask.department}</span>}
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {activeTask.description || 'No description'}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Assigned To</label>
                    <p>{activeTask.assignedTo?.name || '-'}</p>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Assigned By</label>
                    <p>{activeTask.assignedBy?.name || '-'}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Deadline</label>
                    <p className={isOverdue(activeTask.deadline) ? 'text-danger' : ''}>
                      {formatDate(activeTask.deadline)}
                    </p>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Created</label>
                    <p>{formatDate(activeTask.createdAt)}</p>
                  </div>
                </div>
                {activeTask.submissionNote && (
                  <div className="form-group">
                    <label>Submission Note</label>
                    <div
                      style={{
                        background: 'rgba(79,142,247,0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(79,142,247,0.2)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {activeTask.submissionNote}
                    </div>
                  </div>
                )}
                {activeTask.feedback && (
                  <div className="form-group">
                    <label>Feedback</label>
                    <div
                      style={{
                        background: 'rgba(0,230,118,0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,230,118,0.2)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {activeTask.feedback}
                    </div>
                  </div>
                )}
                {activeTask.completionScore && (
                  <div className="form-group">
                    <label>Score</label>
                    <strong style={{ color: 'var(--accent-blue)', fontSize: '1.2rem' }}>
                      {activeTask.completionScore}/10
                    </strong>
                  </div>
                )}

                {is('intern') && ['todo', 'in_progress'].includes(activeTask.status) && (
                  <>
                    <hr style={{ borderColor: 'var(--border-color)' }} />
                    <div className="form-group">
                      <label>Submission Note *</label>
                      <textarea
                        rows="3"
                        placeholder="Describe what you've done..."
                        value={submissionNote}
                        onChange={(e) => setSubmissionNote(e.target.value)}
                      ></textarea>
                    </div>
                  </>
                )}

                {is('admin', 'hr', 'mentor') && activeTask.status === 'submitted' && (
                  <>
                    <hr style={{ borderColor: 'var(--border-color)' }} />
                    <div className="form-group">
                      <label>Feedback</label>
                      <textarea
                        rows="2"
                        placeholder="Feedback for intern..."
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label>Score (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={reviewScore}
                        onChange={(e) => setReviewScore(parseInt(e.target.value) || '')}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              {is('intern') && ['todo', 'in_progress'].includes(activeTask.status) && (
                <button className="btn btn-primary" onClick={handleSubmitTask}>
                  <Send size={12} style={{ marginRight: '4px' }} /> Submit Task
                </button>
              )}
              {is('admin', 'hr', 'mentor') && activeTask.status === 'submitted' && (
                <>
                  <button className="btn btn-danger" onClick={() => handleReviewTask('rejected')}>
                    <X size={12} style={{ marginRight: '4px' }} /> Reject
                  </button>
                  <button className="btn btn-success" onClick={() => handleReviewTask('approved')}>
                    <Check size={12} style={{ marginRight: '4px' }} /> Approve
                  </button>
                </>
              )}
              {is('admin', 'mentor') && activeTask.status === 'todo' && (
                <button className="btn btn-secondary" onClick={handleStartTask}>
                  <Play size={12} style={{ marginRight: '4px' }} /> Start
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="Task title"
                      value={createData.title}
                      onChange={handleCreateTaskChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Detailed task description..."
                      value={createData.description}
                      onChange={handleCreateTaskChange}
                    ></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Assign To *</label>
                      <select
                        name="assignedTo"
                        required
                        value={createData.assignedTo}
                        onChange={handleCreateTaskChange}
                      >
                        <option value="">Select intern</option>
                        {interns.map((i) => (
                          <option key={i._id} value={i._id}>
                            {i.name} ({i.department || ''})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Department</label>
                      <select name="department" value={createData.department} onChange={handleCreateTaskChange}>
                        <option value="">Select</option>
                        {[
                          'Digital Marketing',
                          'HR & Recruitment',
                          'Business Development',
                          'Social Media',
                          'Entrepreneurship Training',
                          'IT Support'
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Priority *</label>
                      <select name="priority" value={createData.priority} onChange={handleCreateTaskChange} required>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Deadline *</label>
                      <input
                        type="date"
                        name="deadline"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={createData.deadline}
                        onChange={handleCreateTaskChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={12} style={{ marginRight: '4px' }} /> Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Tasks;
