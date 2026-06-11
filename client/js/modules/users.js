/* ==========================================================
   users.js  –  IED India Internship Management System
   ========================================================== */

window.UsersModule = (() => {
  let _allUsers = [];
  let _mentors = [];
  let _editingId = null;

  /* ── render ── */
  async function render() {
    const pc = document.getElementById('page-content');
    const role = window.Auth?.user?.role;
    const canEdit = role === 'admin';

    pc.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Users</h1>
        <div class="page-actions">
          ${canEdit ? `<button class="btn btn-primary" id="add-user-btn"><i data-lucide="user-plus"></i> Add User</button>` : ''}
        </div>
      </div>
      <div class="filter-bar">
        <div class="form-group" style="margin:0;flex:1">
          <input type="text" id="search-input" class="form-control" placeholder="Search by name or email…">
        </div>
        <select id="role-filter" class="form-control" style="width:150px">
          <option value="">All Roles</option>
          <option value="intern">Intern</option>
          <option value="mentor">Mentor</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
        <select id="dept-filter" class="form-control" style="width:160px">
          <option value="">All Departments</option>
          <option value="Technology">Technology</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="HR">HR</option>
        </select>
        <button class="btn btn-secondary" id="apply-filter-btn"><i data-lucide="filter"></i> Filter</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Status</th>
              ${canEdit ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody id="users-tbody">
            <tr><td colspan="7" style="text-align:center;padding:2rem"><div class="loading"><div class="spinner"></div></div></td></tr>
          </tbody>
        </table>
      </div>`;

    lucide.createIcons();

    document.getElementById('add-user-btn')?.addEventListener('click', () => _openModal(null));
    document.getElementById('apply-filter-btn')?.addEventListener('click', _applyFilters);
    document.getElementById('search-input')?.addEventListener('keyup', e => { if (e.key === 'Enter') _applyFilters(); });

    await _loadUsers();

    /* prefetch mentors for dropdown */
    try { _mentors = await window.API.get('/users?role=mentor'); } catch (_) { _mentors = []; }
    if (_mentors.users) _mentors = _mentors.users;
  }

  async function _loadUsers(params = {}) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await window.API.get('/users' + (qs ? '?' + qs : ''));
      _allUsers = res.users || res || [];
      _renderTable(_allUsers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ff5252">Failed to load users: ${err.message}</td></tr>`;
    }
  }

  function _applyFilters() {
    const search = document.getElementById('search-input')?.value.trim();
    const role = document.getElementById('role-filter')?.value;
    const dept = document.getElementById('dept-filter')?.value;
    const params = {};
    if (search) params.search = search;
    if (role) params.role = role;
    if (dept) params.department = dept;
    _loadUsers(params);
  }

  function _renderTable(users) {
    const tbody = document.getElementById('users-tbody');
    const canEdit = window.Auth?.user?.role === 'admin';
    if (!tbody) return;
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i data-lucide="users"></i><p>No users found</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4f8ef7,#7c4dff);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0">${(u.name||'?')[0].toUpperCase()}</div>
            <span style="color:var(--text-primary);font-weight:500">${u.name||''}</span>
          </div>
        </td>
        <td style="color:var(--text-secondary)">${u.email||''}</td>
        <td><span class="status-badge status-${u.role}">${u.role||''}</span></td>
        <td>${u.department||'—'}</td>
        <td>${u.phone||'—'}</td>
        <td><span class="status-badge ${u.isActive!==false?'status-active':'status-inactive'}">${u.isActive!==false?'Active':'Inactive'}</span></td>
        ${canEdit ? `<td>
          <div style="display:flex;gap:.4rem">
            <button class="btn btn-sm btn-secondary edit-btn" data-id="${u._id}"><i data-lucide="edit-2"></i></button>
            <button class="btn btn-sm btn-danger del-btn" data-id="${u._id}">${u.isActive!==false?'Deactivate':'Activate'}</button>
          </div>
        </td>` : ''}
      </tr>`).join('');

    lucide.createIcons();

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = _allUsers.find(u => u._id === btn.dataset.id);
        if (user) _openModal(user);
      });
    });

    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', () => _toggleActive(btn.dataset.id));
    });
  }

  async function _toggleActive(id) {
    const user = _allUsers.find(u => u._id === id);
    if (!user) return;
    const action = user.isActive !== false ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await window.API.put(`/users/${id}`, { isActive: user.isActive === false });
      window.showToast(`User ${action}d successfully`, 'success');
      _applyFilters();
    } catch (err) {
      window.showToast(err.message || 'Failed', 'error');
    }
  }

  function _openModal(user) {
    _editingId = user?._id || null;
    const mentorOptions = (_mentors.users || _mentors).map(m =>
      `<option value="${m._id}" ${user?.assignedMentor?._id === m._id || user?.assignedMentor === m._id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    const body = `
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="u-name" class="form-control" value="${user?.name||''}" placeholder="John Doe">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="u-email" class="form-control" value="${user?.email||''}" placeholder="john@example.com">
          </div>
        </div>
        ${!user ? `<div class="form-group">
          <label>Password *</label>
          <input type="password" id="u-password" class="form-control" placeholder="Min 6 characters">
        </div>` : ''}
        <div class="form-row">
          <div class="form-group">
            <label>Role *</label>
            <select id="u-role" class="form-control">
              <option value="intern" ${user?.role==='intern'?'selected':''}>Intern</option>
              <option value="mentor" ${user?.role==='mentor'?'selected':''}>Mentor</option>
              <option value="hr" ${user?.role==='hr'?'selected':''}>HR</option>
              <option value="admin" ${user?.role==='admin'?'selected':''}>Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select id="u-dept" class="form-control">
              <option value="">Select…</option>
              ${['Technology','Design','Marketing','Finance','Operations','HR'].map(d =>
                `<option value="${d}" ${user?.department===d?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="u-phone" class="form-control" value="${user?.phone||''}" placeholder="+91 9876543210">
        </div>
        <div class="form-row" id="intern-fields" style="${user?.role!=='intern' && user ? 'display:none' : ''}">
          <div class="form-group">
            <label>Internship Start</label>
            <input type="date" id="u-start" class="form-control" value="${user?.internshipStart ? user.internshipStart.slice(0,10) : ''}">
          </div>
          <div class="form-group">
            <label>Internship End</label>
            <input type="date" id="u-end" class="form-control" value="${user?.internshipEnd ? user.internshipEnd.slice(0,10) : ''}">
          </div>
        </div>
        <div class="form-group" id="mentor-field" style="${user?.role!=='intern' && user ? 'display:none' : ''}">
          <label>Assigned Mentor</label>
          <select id="u-mentor" class="form-control">
            <option value="">None</option>
            ${mentorOptions}
          </select>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-user-btn">${user ? 'Update User' : 'Create User'}</button>`;

    window.showModal(user ? 'Edit User' : 'Add New User', body, footer);

    document.getElementById('u-role')?.addEventListener('change', e => {
      const isIntern = e.target.value === 'intern';
      document.getElementById('intern-fields').style.display = isIntern ? '' : 'none';
      document.getElementById('mentor-field').style.display = isIntern ? '' : 'none';
    });

    document.getElementById('save-user-btn')?.addEventListener('click', _saveUser);
  }

  async function _saveUser() {
    const name = document.getElementById('u-name')?.value.trim();
    const email = document.getElementById('u-email')?.value.trim();
    const role = document.getElementById('u-role')?.value;
    const department = document.getElementById('u-dept')?.value;
    const phone = document.getElementById('u-phone')?.value.trim();
    const password = document.getElementById('u-password')?.value;
    const internshipStart = document.getElementById('u-start')?.value;
    const internshipEnd = document.getElementById('u-end')?.value;
    const assignedMentor = document.getElementById('u-mentor')?.value;

    if (!name || !email || !role) {
      window.showToast('Name, email and role are required', 'error');
      return;
    }
    if (!_editingId && !password) {
      window.showToast('Password is required for new users', 'error');
      return;
    }

    const payload = { name, email, role, department, phone };
    if (!_editingId) payload.password = password;
    if (role === 'intern') {
      if (internshipStart) payload.internshipStart = internshipStart;
      if (internshipEnd) payload.internshipEnd = internshipEnd;
      if (assignedMentor) payload.assignedMentor = assignedMentor;
    }

    const btn = document.getElementById('save-user-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      if (_editingId) {
        await window.API.put(`/users/${_editingId}`, payload);
        window.showToast('User updated successfully', 'success');
      } else {
        await window.API.post('/users', payload);
        window.showToast('User created successfully', 'success');
      }
      window.closeModal();
      _applyFilters();
    } catch (err) {
      window.showToast(err.message || 'Failed to save user', 'error');
      btn.disabled = false;
      btn.textContent = _editingId ? 'Update User' : 'Create User';
    }
  }

  return { render };
})();
