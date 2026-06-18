import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { UserPlus, Filter, Edit2, X, Check, Search } from 'lucide-react';

export function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for create mode

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'intern',
    department: '',
    phone: '',
    internshipStart: '',
    internshipEnd: '',
    assignedMentor: ''
  });

  const canEdit = currentUser?.role === 'admin';

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await API.get('/users' + (qs ? '?' + qs : ''));
      setUsers(res.users || res || []);
    } catch (err) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const res = await API.get('/users?role=mentor');
      setMentors(res.users || res || []);
    } catch (_) {
      setMentors([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMentors();
  }, []);

  const handleApplyFilters = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (roleFilter) params.role = roleFilter;
    if (deptFilter) params.department = deptFilter;
    fetchUsers(params);
  };

  const handleToggleActive = async (userToToggle) => {
    const action = userToToggle.isActive !== false ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await API.put(`/users/${userToToggle._id}`, { isActive: userToToggle.isActive === false });
      showToast(`User ${action}d successfully`, 'success');
      handleApplyFilters();
    } catch (err) {
      showToast(err.message || 'Failed to toggle activation status', 'error');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'intern',
      department: '',
      phone: '',
      internshipStart: '',
      internshipEnd: '',
      assignedMentor: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'intern',
      department: u.department || '',
      phone: u.phone || '',
      internshipStart: u.internshipStart ? u.internshipStart.slice(0, 10) : '',
      internshipEnd: u.internshipEnd ? u.internshipEnd.slice(0, 10) : '',
      assignedMentor: u.assignedMentor?._id || u.assignedMentor || ''
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const { name, email, role, department, phone, password, internshipStart, internshipEnd, assignedMentor } = formData;

    if (!name || !email || !role) {
      showToast('Name, email and role are required', 'error');
      return;
    }
    if (!editingUser && !password) {
      showToast('Password is required for new users', 'error');
      return;
    }

    const payload = { name, email, role, department, phone };
    if (!editingUser) payload.password = password;
    
    if (role === 'intern') {
      if (internshipStart) payload.internshipStart = internshipStart;
      if (internshipEnd) payload.internshipEnd = internshipEnd;
      if (assignedMentor) payload.assignedMentor = assignedMentor;
    }

    try {
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, payload);
        showToast('User updated successfully', 'success');
      } else {
        await API.post('/users', payload);
        showToast('User created successfully', 'success');
      }
      setModalOpen(false);
      handleApplyFilters();
    } catch (err) {
      showToast(err.message || 'Failed to save user', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <div className="page-actions">
          {canEdit && (
            <button className="btn btn-primary" onClick={handleOpenCreateModal}>
              <UserPlus size={16} /> Add User
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
          />
        </div>
        <select
          className="form-control"
          style={{ width: '150px' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="intern">Intern</option>
          <option value="mentor">Mentor</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="form-control"
          style={{ width: '160px' }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {['Technology', 'Design', 'Marketing', 'Finance', 'Operations', 'HR'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={handleApplyFilters}>
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="table-container glass-card">
        {loading ? (
          <div className="loading" style={{ padding: '40px' }}><div className="spinner"></div></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg,#4f8ef7,#7c4dff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '.8rem',
                            color: 'white',
                            flexShrink: 0
                          }}
                        >
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || ''}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email || ''}</td>
                    <td>
                      <span className={`status-badge status-${u.role}`}>{u.role || ''}</span>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`status-badge ${u.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button
                            className="btn btn-sm btn-secondary edit-btn"
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit User"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger del-btn"
                            onClick={() => handleToggleActive(u)}
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 7 : 6}>
                    <div className="empty-state">
                      <div className="empty-icon"><Search size={48} color="var(--text-muted)" /></div>
                      <h3>No users found</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="form-control"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="form-control"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  {!editingUser && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        required
                        className="form-control"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Min 6 characters"
                      />
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Role *</label>
                      <select
                        name="role"
                        className="form-control"
                        value={formData.role}
                        onChange={handleFormChange}
                      >
                        <option value="intern">Intern</option>
                        <option value="mentor">Mentor</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Department</label>
                      <select
                        name="department"
                        className="form-control"
                        value={formData.department}
                        onChange={handleFormChange}
                      >
                        <option value="">Select…</option>
                        {['Technology', 'Design', 'Marketing', 'Finance', 'Operations', 'HR'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  
                  {formData.role === 'intern' && (
                    <>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Internship Start</label>
                          <input
                            type="date"
                            name="internshipStart"
                            className="form-control"
                            value={formData.internshipStart}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Internship End</label>
                          <input
                            type="date"
                            name="internshipEnd"
                            className="form-control"
                            value={formData.internshipEnd}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Assigned Mentor</label>
                        <select
                          name="assignedMentor"
                          className="form-control"
                          value={formData.assignedMentor}
                          onChange={handleFormChange}
                        >
                          <option value="">None</option>
                          {mentors.map(m => (
                            <option key={m._id} value={m._id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Users;
