// ═══════════════════════════════════════════════════════════
// IED India IMS — App Router & Main Controller
// ═══════════════════════════════════════════════════════════

const ROLE_NAV = {
  admin: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
      { id: 'analytics',     icon: 'bar-chart-2',      label: 'Analytics' },
    ]},
    { section: 'Management', items: [
      { id: 'users',         icon: 'users',            label: 'User Management' },
      { id: 'applications',  icon: 'file-text',        label: 'Applications' },
      { id: 'interviews',    icon: 'calendar',         label: 'Interviews' },
      { id: 'onboarding',    icon: 'clipboard-check',  label: 'Onboarding' },
    ]},
    { section: 'Operations', items: [
      { id: 'attendance',    icon: 'clock',            label: 'Attendance' },
      { id: 'tasks',         icon: 'check-square',     label: 'Tasks' },
      { id: 'leaves',        icon: 'calendar-off',     label: 'Leave Requests' },
    ]},
    { section: 'Communication', items: [
      { id: 'communication', icon: 'message-square',   label: 'Messages' },
    ]},
    { section: 'Reports', items: [
      { id: 'evaluation',    icon: 'star',             label: 'Evaluations' },
      { id: 'certificates',  icon: 'award',            label: 'Certificates' },
    ]},
  ],
  hr: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
      { id: 'analytics',     icon: 'bar-chart-2',      label: 'Analytics' },
    ]},
    { section: 'Recruitment', items: [
      { id: 'applications',  icon: 'file-text',        label: 'Applications' },
      { id: 'interviews',    icon: 'calendar',         label: 'Interviews' },
      { id: 'onboarding',    icon: 'clipboard-check',  label: 'Onboarding' },
    ]},
    { section: 'Operations', items: [
      { id: 'users',         icon: 'users',            label: 'Intern Profiles' },
      { id: 'attendance',    icon: 'clock',            label: 'Attendance' },
      { id: 'tasks',         icon: 'check-square',     label: 'Tasks' },
      { id: 'leaves',        icon: 'calendar-off',     label: 'Leave Requests' },
      { id: 'certificates',  icon: 'award',            label: 'Certificates' },
      { id: 'communication', icon: 'message-square',   label: 'Messages' },
    ]},
  ],
  mentor: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
    ]},
    { section: 'My Interns', items: [
      { id: 'tasks',         icon: 'check-square',     label: 'Tasks' },
      { id: 'attendance',    icon: 'clock',            label: 'Attendance' },
      { id: 'evaluation',    icon: 'star',             label: 'Evaluations' },
      { id: 'leaves',        icon: 'calendar-off',     label: 'Leave Requests' },
    ]},
    { section: 'Communication', items: [
      { id: 'communication', icon: 'message-square',   label: 'Messages' },
    ]},
  ],
  intern: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
    ]},
    { section: 'My Work', items: [
      { id: 'tasks',         icon: 'check-square',     label: 'My Tasks' },
      { id: 'attendance',    icon: 'clock',            label: 'Attendance' },
      { id: 'leaves',        icon: 'calendar-off',     label: 'Leave' },
    ]},
    { section: 'My Profile', items: [
      { id: 'onboarding',    icon: 'clipboard-check',  label: 'Onboarding' },
      { id: 'evaluation',    icon: 'star',             label: 'My Evaluations' },
      { id: 'certificates',  icon: 'award',            label: 'Certificates' },
      { id: 'communication', icon: 'message-square',   label: 'Messages' },
    ]},
  ]
};

const MODULE_TITLES = {
  dashboard: 'Dashboard', analytics: 'Analytics', users: 'User Management',
  applications: 'Applications', interviews: 'Interviews', onboarding: 'Onboarding',
  attendance: 'Attendance', tasks: 'Tasks', leaves: 'Leave Management',
  communication: 'Messages', evaluation: 'Evaluations', certificates: 'Certificates',
};

const MODULE_MAP = {
  dashboard:     () => window.DashboardModule?.render(),
  analytics:     () => window.AnalyticsModule?.render(),
  users:         () => window.UsersModule?.render(),
  applications:  () => window.ApplicationsModule?.render(),
  interviews:    () => window.InterviewsModule?.render(),
  onboarding:    () => window.OnboardingModule?.render(),
  attendance:    () => window.AttendanceModule?.render(),
  tasks:         () => window.TasksModule?.render(),
  leaves:        () => window.LeavesModule?.render(),
  communication: () => window.CommunicationModule?.render(),
  evaluation:    () => window.EvaluationModule?.render(),
  certificates:  () => window.CertificatesModule?.render(),
};

const App = (() => {
  let currentModule = 'dashboard';
  let notifInterval = null;

  const buildSidebar = () => {
    const role = Auth.role;
    const nav = document.getElementById('sidebar-nav');
    const navConfig = ROLE_NAV[role] || [];
    nav.innerHTML = navConfig.map(section => `
      <div class="sidebar-nav-section">${section.section}</div>
      ${section.items.map(item => `
        <button class="sidebar-nav-item ${item.id === currentModule ? 'active' : ''}"
          data-module="${item.id}" id="nav-${item.id}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
          ${item.id === 'communication' ? '<span class="nav-badge hidden" id="msg-badge">0</span>' : ''}
        </button>
      `).join('')}
    `).join('');

    nav.querySelectorAll('.sidebar-nav-item[data-module]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.module));
    });
    lucide.createIcons();

    // Build bottom nav for mobile
    buildBottomNav(role, navConfig);
  };

  // ── Bottom Nav (mobile only) ────────────────────────────
  const BOTTOM_NAV_MAX = 5;

  const buildBottomNav = (role, navConfig) => {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    // Collect all nav items flat, then pick the most important ones
    const allItems = navConfig.flatMap(s => s.items);
    // Always show dashboard first, then pick next items up to max
    const priority = ['dashboard', 'tasks', 'attendance', 'communication', 'leaves',
                      'applications', 'users', 'evaluation', 'analytics'];
    const sorted = [
      ...priority.filter(id => allItems.find(i => i.id === id)).map(id => allItems.find(i => i.id === id)),
      ...allItems.filter(i => !priority.includes(i.id))
    ].slice(0, BOTTOM_NAV_MAX);

    bottomNav.innerHTML = sorted.map(item => `
      <button class="bottom-nav-item ${item.id === currentModule ? 'active' : ''}" data-module="${item.id}">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label.replace('Management','').replace('Requests','').trim()}</span>
        ${item.id === 'communication' ? '<span class="bottom-nav-dot hidden" id="bottom-msg-dot"></span>' : ''}
      </button>
    `).join('');

    bottomNav.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.module));
    });
    lucide.createIcons();
  };

  const updateUserUI = () => {
    const u = Auth.user;
    if (!u) return;
    const initials = getInitials(u.name);
    
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const topbarAvatar = document.getElementById('topbar-avatar');
    const dropdownAvatar = document.getElementById('dropdown-avatar');
    
    const avatarHTML = u.photo
      ? `<img src="${u.photo}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
      : initials;

    if (sidebarAvatar) sidebarAvatar.innerHTML = avatarHTML;
    if (topbarAvatar) topbarAvatar.innerHTML = avatarHTML;
    if (dropdownAvatar) dropdownAvatar.innerHTML = avatarHTML;

    document.getElementById('sidebar-username').textContent = u.name;
    const roleEl = document.getElementById('sidebar-role');
    if (roleEl) {
      roleEl.textContent = u.role.toUpperCase();
      roleEl.className = `badge badge-${u.role}`;
    }
    // Update dropdown info
    const dropdownName = document.getElementById('dropdown-name');
    const dropdownEmail = document.getElementById('dropdown-email');
    if (dropdownName) dropdownName.textContent = u.name;
    if (dropdownEmail) dropdownEmail.textContent = u.email;
  };

  const navigate = (module) => {
    currentModule = module;
    document.getElementById('topbar-title').textContent = MODULE_TITLES[module] || module;

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-nav-item[data-module]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.module === module);
    });

    // Update active state in bottom nav
    document.querySelectorAll('.bottom-nav-item[data-module]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.module === module);
    });

    // Render module
    const content = document.getElementById('page-content');
    content.innerHTML = renderLoading();
    const renderer = MODULE_MAP[module];
    if (renderer) {
      try { renderer(); } catch(e) { content.innerHTML = `<div class="error-msg">Failed to load module: ${e.message}</div>`; }
    } else {
      content.innerHTML = renderEmpty('Module not available', 'This feature is coming soon.');
    }

    // Close mobile sidebar and overlay
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
    // Close profile dropdown if open
    closeProfileDropdown();
  };

  const pollNotifications = async () => {
    try {
      const data = await API.get('/messages/unread');
      const badge = document.getElementById('msg-badge');
      const notifBadge = document.getElementById('notif-badge');
      const bottomDot = document.getElementById('bottom-msg-dot');
      const count = data.count || 0;
      if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
      if (notifBadge) { notifBadge.textContent = count; notifBadge.classList.toggle('hidden', count === 0); }
      if (bottomDot) { bottomDot.classList.toggle('hidden', count === 0); }
    } catch {}
  };

  // ── Profile Dropdown ────────────────────────────────────
  const toggleProfileDropdown = () => {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
      lucide.createIcons();
    }
  };

  const closeProfileDropdown = () => {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  };

  // ── Edit Profile Modal ──────────────────────────────────
  const showEditProfileModal = () => {
    closeProfileDropdown();
    const u = Auth.user;
    const photoPreview = u.photo
      ? `<img src="${u.photo}" alt="Profile" />`
      : `<div class="avatar">${getInitials(u.name)}</div>`;

    showModal('Edit Profile', `
      <form id="edit-profile-form" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:12px;width:100%">
          <label style="align-self:flex-start;font-size:0.875rem;font-weight:600;color:var(--text-primary)">Profile Photo</label>
          <div class="profile-photo-upload-wrapper" id="photo-upload-trigger" title="Click to change photo">
            <div id="profile-photo-preview" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
              ${photoPreview}
            </div>
            <div class="photo-upload-overlay">
              <i data-lucide="pencil" style="color:#ffffff;width:22px;height:22px"></i>
            </div>
          </div>
          <input type="file" id="profile-photo-input" accept="image/*" style="display:none" />
          <small style="color:var(--text-muted);font-size:0.75rem">Hover and click on the photo to upload. Max 5MB. JPG, PNG or WebP.</small>
        </div>
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="edit-name" value="${u.name}" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${u.email}" disabled style="opacity:0.6;cursor:not-allowed" />
          <small style="color:var(--text-muted);font-size:0.75rem">Email cannot be changed</small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="edit-phone" value="${u.phone || ''}" placeholder="10-digit number" />
          </div>
          <div class="form-group">
            <label>College</label>
            <input type="text" id="edit-college" value="${u.college || ''}" placeholder="Your college" />
          </div>
        </div>
        <div class="form-group">
          <label>Department</label>
          <select id="edit-department">
            <option value="">Select Department</option>
            ${['Digital Marketing','HR & Recruitment','Business Development','Social Media','Entrepreneurship Training','IT Support','Management'].map(d =>
              `<option ${u.department === d ? 'selected' : ''}>${d}</option>`
            ).join('')}
          </select>
        </div>
      </form>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="App.saveProfile()"><i data-lucide="check"></i> Save Changes</button>`
    );

    // Trigger file click on avatar hover container click
    document.getElementById('photo-upload-trigger')?.addEventListener('click', () => {
      document.getElementById('profile-photo-input')?.click();
    });

    // Photo preview on file select
    document.getElementById('profile-photo-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('profile-photo-preview').innerHTML =
            `<img src="${ev.target.result}" alt="Preview" />`;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const saveProfile = async () => {
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-name').value);
    formData.append('phone', document.getElementById('edit-phone').value);
    formData.append('college', document.getElementById('edit-college').value);
    formData.append('department', document.getElementById('edit-department').value);

    const photoFile = document.getElementById('profile-photo-input')?.files[0];
    if (photoFile) formData.append('photo', photoFile);

    const btn = document.querySelector('#modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Saving...'; }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${Auth.token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      Auth.user = data.user;
      updateUserUI();
      showToast('Profile updated successfully!', 'success');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Save Changes'; lucide.createIcons(); }
    }
  };

  // ── Change Password Modal ───────────────────────────────
  const showChangePasswordModal = () => {
    closeProfileDropdown();
    showModal('Change Password', `
      <form id="change-password-form" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label>Current Password *</label>
          <input type="password" id="current-password" required placeholder="Enter current password" />
        </div>
        <div class="form-group">
          <label>New Password *</label>
          <input type="password" id="new-password" required placeholder="Min 6 characters" minlength="6" />
        </div>
        <div class="form-group">
          <label>Confirm New Password *</label>
          <input type="password" id="confirm-password" required placeholder="Re-enter new password" minlength="6" />
        </div>
      </form>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="App.changePassword()"><i data-lucide="key-round"></i> Update Password</button>`
    );
  };

  const changePassword = async () => {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    const btn = document.querySelector('#modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Updating...'; }

    try {
      await API.put('/auth/password', { currentPassword, newPassword });
      showToast('Password updated successfully!', 'success');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="key-round"></i> Update Password'; lucide.createIcons(); }
    }
  };

  const boot = async () => {
    Auth.init();
    if (!Auth.isAuthenticated()) {
      document.getElementById('login-page').classList.remove('hidden');
      document.getElementById('signup-page').classList.add('hidden');
      document.getElementById('app').classList.add('hidden');
      lucide.createIcons();
      return;
    }

    // Validate token with server before proceeding
    try {
      await Auth.refreshUser();
    } catch {
      return;
    }
    if (!Auth.isAuthenticated()) {
      return;
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('apply-page').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    updateUserUI();
    buildSidebar();
    navigate('dashboard');

    // Sidebar collapse
    document.getElementById('sidebar-collapse').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.getElementById('main-content');
      const topbar = document.querySelector('.topbar');
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('sidebar-collapsed');
      topbar?.classList.toggle('sidebar-collapsed');
    });

    // Mobile menu — topbar hamburger
    const openSidebar = () => {
      document.getElementById('sidebar').classList.add('mobile-open');
      document.getElementById('sidebar-overlay').classList.add('visible');
    };
    const closeSidebar = () => {
      document.getElementById('sidebar').classList.remove('mobile-open');
      document.getElementById('sidebar-overlay').classList.remove('visible');
    };

    document.getElementById('menu-toggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // Logout (sidebar)
    document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

    // Sidebar Profile actions
    document.getElementById('sidebar-edit-profile')?.addEventListener('click', () => showEditProfileModal());
    document.getElementById('sidebar-change-password')?.addEventListener('click', () => showChangePasswordModal());

    // Notification bell -> go to messages
    document.getElementById('notif-btn')?.addEventListener('click', () => navigate('communication'));

    // ── Profile Dropdown Handlers ──────────────────────────
    document.getElementById('topbar-avatar')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });

    document.getElementById('dropdown-edit-profile')?.addEventListener('click', () => showEditProfileModal());
    document.getElementById('dropdown-change-password')?.addEventListener('click', () => showChangePasswordModal());
    document.getElementById('dropdown-logout')?.addEventListener('click', () => Auth.logout());

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('topbar-user-wrap');
      if (wrap && !wrap.contains(e.target)) {
        closeProfileDropdown();
      }
    });

    // Poll notifications every 30s
    pollNotifications();
    notifInterval = setInterval(pollNotifications, 30000);

    lucide.createIcons();
  };

  return {
    boot, navigate, saveProfile, changePassword,
    showEditProfileModal, showChangePasswordModal,
    get currentModule() { return currentModule; }
  };
})();

window.App = App;

// ── Initialize ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  App.boot();
});

// Leaves module (inline for simplicity)
window.LeavesModule = {
  render: async () => {
    const content = document.getElementById('page-content');
    const isIntern = Auth.is('intern');
    content.innerHTML = renderLoading();
    try {
      const data = await API.get('/leaves');
      const leaves = data.leaves || [];
      const canApprove = Auth.is('admin', 'hr', 'mentor');

      content.innerHTML = `
        <div class="page-header">
          <div><h2>Leave Management</h2><p>${isIntern ? 'Apply for leave and track your requests' : 'Review and manage leave requests'}</p></div>
          ${isIntern ? `<button class="btn btn-primary" onclick="LeavesModule.showApplyModal()"><i data-lucide="plus"></i> Apply Leave</button>` : ''}
        </div>
        <div class="table-container glass-card">
          <table>
            <thead><tr>
              ${!isIntern ? '<th>Intern</th>' : ''}
              <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>
              ${canApprove ? '<th>Actions</th>' : ''}
            </tr></thead>
            <tbody>
              ${leaves.length ? leaves.map(l => `
                <tr>
                  ${!isIntern ? `<td><strong>${l.internId?.name || '-'}</strong><br><small class="text-muted">${l.internId?.department || ''}</small></td>` : ''}
                  <td><span class="status-badge" style="text-transform:capitalize">${l.type}</span></td>
                  <td>${formatDate(l.fromDate)}</td>
                  <td>${formatDate(l.toDate)}</td>
                  <td><strong>${l.days}</strong></td>
                  <td style="max-width:200px">${l.reason}</td>
                  <td>${statusBadge(l.status)}</td>
                  ${canApprove ? `<td class="actions-cell">
                    ${l.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" onclick="LeavesModule.updateStatus('${l._id}','approved')"><i data-lucide="check"></i></button>
                      <button class="btn btn-danger btn-sm" onclick="LeavesModule.updateStatus('${l._id}','rejected')"><i data-lucide="x"></i></button>
                    ` : '<span class="text-muted">-</span>'}
                  </td>` : ''}
                </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No leave records found</td></tr>`}
            </tbody>
          </table>
        </div>`;
      lucide.createIcons();
    } catch(err) { content.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  showApplyModal: () => {
    showModal('Apply for Leave', `
      <form id="leave-form" style="display:flex;flex-direction:column;gap:16px">
        <div class="form-row">
          <div class="form-group"><label>Leave Type</label>
            <select name="type"><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="personal">Personal Leave</option><option value="emergency">Emergency</option></select>
          </div>
          <div class="form-group"><label>Days Count</label><input type="number" name="days" value="1" min="1" readonly /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>From Date *</label><input type="date" name="fromDate" required min="${new Date().toISOString().split('T')[0]}" /></div>
          <div class="form-group"><label>To Date *</label><input type="date" name="toDate" required min="${new Date().toISOString().split('T')[0]}" /></div>
        </div>
        <div class="form-group"><label>Reason *</label><textarea name="reason" required placeholder="Briefly describe your reason..."></textarea></div>
      </form>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="LeavesModule.submitLeave()">Submit Request <i data-lucide="send"></i></button>`
    );
    // Auto-calculate days
    ['fromDate','toDate'].forEach(n => document.querySelector(`[name="${n}"]`)?.addEventListener('change', () => {
      const from = new Date(document.querySelector('[name="fromDate"]').value);
      const to = new Date(document.querySelector('[name="toDate"]').value);
      if (from && to && to >= from) document.querySelector('[name="days"]').value = Math.ceil((to-from)/(1000*3600*24))+1;
    }));
  },

  submitLeave: async () => {
    const form = document.getElementById('leave-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    try {
      await API.post('/leaves', body);
      showToast('Leave application submitted!', 'success');
      closeModal();
      LeavesModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  updateStatus: async (id, status) => {
    try {
      await API.patch(`/leaves/${id}/status`, { status });
      showToast(`Leave ${status} successfully`, 'success');
      LeavesModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  }
};
