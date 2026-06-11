// ═══════════════════════════════════════════════════════════
// IED India IMS — Tasks Module (Kanban Board)
// ═══════════════════════════════════════════════════════════

window.TasksModule = {
  _tasks: [],

  render: async () => {
    const content = document.getElementById('page-content');
    content.innerHTML = renderLoading();
    try {
      const data = await API.get('/tasks');
      TasksModule._tasks = data.tasks || [];
      TasksModule._renderBoard(content);
    } catch(err) { content.innerHTML = `<div class="error-msg">Failed to load tasks: ${err.message}</div>`; }
  },

  _renderBoard: (content) => {
    const tasks = TasksModule._tasks;
    const canCreate = Auth.is('admin', 'hr', 'mentor');
    const COLS = [
      { key: 'todo',       label: 'To Do',      color: 'var(--accent-blue)' },
      { key: 'in_progress',label: 'In Progress', color: 'var(--accent-orange)' },
      { key: 'submitted',  label: 'Submitted',   color: 'var(--accent-purple)' },
      { key: 'approved',   label: 'Approved',    color: 'var(--accent-green)' },
      { key: 'rejected',   label: 'Rejected',    color: 'var(--accent-red)' },
    ];

    content.innerHTML = `
      <div class="page-header">
        <div><h2>Task Management</h2><p>${Auth.is('intern') ? 'View and submit your assigned tasks' : 'Assign and review intern tasks'}</p></div>
        <div style="display:flex;gap:8px">
          <select id="task-filter-priority" style="width:140px" onchange="TasksModule.applyFilters()">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option><option value="high">High</option>
            <option value="medium">Medium</option><option value="low">Low</option>
          </select>
          ${canCreate ? `<button class="btn btn-primary" onclick="TasksModule.showCreateModal()"><i data-lucide="plus"></i> New Task</button>` : ''}
        </div>
      </div>

      <div class="kanban-board" id="kanban-board">
        ${COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return `
            <div class="kanban-col" data-status="${col.key}">
              <div class="kanban-col-header">
                <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
                <span class="kanban-count">${colTasks.length}</span>
              </div>
              <div class="kanban-cards" id="col-${col.key}">
                ${colTasks.map(t => TasksModule._renderTaskCard(t)).join('')}
                ${colTasks.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem">No tasks</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>`;

    lucide.createIcons();
  },

  _renderTaskCard: (t) => `
    <div class="task-card" onclick="TasksModule.showTaskDetail('${t._id}')">
      <h5>${t.title}</h5>
      <p>${(t.description||'').slice(0,80)}${t.description?.length>80?'...':''}</p>
      <div style="margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${priorityBadge(t.priority)}
        ${t.department ? `<span class="status-badge" style="font-size:0.65rem">${t.department}</span>` : ''}
      </div>
      <div class="task-meta">
        <span class="task-deadline ${isOverdue(t.deadline) && !['approved','rejected'].includes(t.status) ? 'overdue' : ''}">
          ${formatDate(t.deadline)}
        </span>
        <div class="avatar" style="width:24px;height:24px;font-size:0.65rem">${getInitials(t.assignedTo?.name||'?')}</div>
      </div>
      ${t.assignedTo?.name ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">${t.assignedTo.name}</div>` : ''}
    </div>`,

  showTaskDetail: (id) => {
    const t = TasksModule._tasks.find(t => t._id === id);
    if (!t) return;
    const isIntern = Auth.is('intern');
    const canReview = Auth.is('admin', 'hr', 'mentor') && t.status === 'submitted';
    const canSubmit = isIntern && ['todo','in_progress'].includes(t.status);

    showModal(`Task: ${t.title}`, `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${statusBadge(t.status)} ${priorityBadge(t.priority)}
          ${t.department ? `<span class="status-badge">${t.department}</span>` : ''}
        </div>
        <div class="form-group"><label>Description</label><div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;font-size:0.875rem">${t.description||'No description'}</div></div>
        <div class="form-row">
          <div class="form-group"><label>Assigned To</label><p>${t.assignedTo?.name||'-'}</p></div>
          <div class="form-group"><label>Assigned By</label><p>${t.assignedBy?.name||'-'}</p></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Deadline</label><p class="${isOverdue(t.deadline)?'text-danger':''}">${formatDate(t.deadline)}</p></div>
          <div class="form-group"><label>Created</label><p>${formatDate(t.createdAt)}</p></div>
        </div>
        ${t.submissionNote ? `<div class="form-group"><label>Submission Note</label><div style="background:rgba(79,142,247,0.1);padding:12px;border-radius:8px;border:1px solid rgba(79,142,247,0.2);font-size:0.875rem">${t.submissionNote}</div></div>` : ''}
        ${t.feedback ? `<div class="form-group"><label>Feedback</label><div style="background:rgba(0,230,118,0.1);padding:12px;border-radius:8px;border:1px solid rgba(0,230,118,0.2);font-size:0.875rem">${t.feedback}</div></div>` : ''}
        ${t.completionScore ? `<div class="form-group"><label>Score</label><strong style="color:var(--accent-blue);font-size:1.2rem">${t.completionScore}/10</strong></div>` : ''}

        ${canSubmit ? `
          <hr style="border-color:var(--border-color)">
          <div class="form-group"><label>Submission Note *</label><textarea id="sub-note" rows="3" placeholder="Describe what you've done..."></textarea></div>` : ''}

        ${canReview ? `
          <hr style="border-color:var(--border-color)">
          <div class="form-group"><label>Feedback</label><textarea id="review-feedback" rows="2" placeholder="Feedback for intern..."></textarea></div>
          <div class="form-group"><label>Score (1-10)</label><input type="number" id="review-score" min="1" max="10" value="8" /></div>` : ''}
      </div>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>
       ${canSubmit ? `<button class="btn btn-primary" onclick="TasksModule.submitTask('${id}')"><i data-lucide="send"></i> Submit Task</button>` : ''}
       ${canReview ? `
         <button class="btn btn-danger" onclick="TasksModule.reviewTask('${id}','rejected')"><i data-lucide="x"></i> Reject</button>
         <button class="btn btn-success" onclick="TasksModule.reviewTask('${id}','approved')"><i data-lucide="check"></i> Approve</button>` : ''}
       ${Auth.is('admin','mentor') && t.status === 'todo' ? `<button class="btn btn-secondary" onclick="TasksModule.updateStatus('${id}','in_progress')"><i data-lucide="play"></i> Start</button>` : ''}`
    );
  },

  showCreateModal: async () => {
    try {
      const internsData = await API.get('/users?role=intern');
      const interns = internsData.users || [];
      showModal('Create New Task', `
        <form id="task-form" style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group"><label>Title *</label><input type="text" name="title" required placeholder="Task title" /></div>
          <div class="form-group"><label>Description</label><textarea name="description" rows="3" placeholder="Detailed task description..."></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Assign To *</label>
              <select name="assignedTo" required>
                <option value="">Select intern</option>
                ${interns.map(i=>`<option value="${i._id}">${i.name} (${i.department||''})</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Department</label>
              <select name="department">
                <option value="">Select</option>
                ${['Digital Marketing','HR & Recruitment','Business Development','Social Media','Entrepreneurship Training','IT Support'].map(d=>`<option>${d}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Priority *</label>
              <select name="priority" required>
                <option value="low">Low</option><option value="medium" selected>Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="form-group"><label>Deadline *</label><input type="date" name="deadline" required min="${new Date().toISOString().split('T')[0]}" /></div>
          </div>
        </form>`,
        `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
         <button class="btn btn-primary" onclick="TasksModule.createTask()"><i data-lucide="plus"></i> Create Task</button>`
      );
    } catch(err) { showToast(err.message, 'error'); }
  },

  createTask: async () => {
    const form = document.getElementById('task-form');
    if (!form?.checkValidity()) { form?.reportValidity(); return; }
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    try {
      await API.post('/tasks', body);
      showToast('Task created successfully!', 'success');
      closeModal();
      TasksModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  submitTask: async (id) => {
    const note = document.getElementById('sub-note')?.value?.trim();
    if (!note) { showToast('Please add a submission note', 'error'); return; }
    try {
      await API.patch(`/tasks/${id}/submit`, { submissionNote: note });
      showToast('Task submitted for review!', 'success');
      closeModal();
      TasksModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  reviewTask: async (id, status) => {
    const feedback = document.getElementById('review-feedback')?.value;
    const completionScore = document.getElementById('review-score')?.value;
    try {
      await API.patch(`/tasks/${id}/review`, { status, feedback, completionScore });
      showToast(`Task ${status}!`, status === 'approved' ? 'success' : 'info');
      closeModal();
      TasksModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  updateStatus: async (id, status) => {
    try {
      await API.put(`/tasks/${id}`, { status });
      showToast('Task updated', 'success');
      closeModal();
      TasksModule.render();
    } catch(err) { showToast(err.message, 'error'); }
  },

  applyFilters: () => {
    const priority = document.getElementById('task-filter-priority')?.value;
    const filtered = priority ? TasksModule._tasks.filter(t => t.priority === priority) : TasksModule._tasks;
    const COLS = ['todo','in_progress','submitted','approved','rejected'];
    COLS.forEach(col => {
      const el = document.getElementById(`col-${col}`);
      if (!el) return;
      const colTasks = filtered.filter(t => t.status === col);
      el.innerHTML = colTasks.map(t => TasksModule._renderTaskCard(t)).join('') ||
        `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem">No tasks</div>`;
    });
    lucide.createIcons();
  }
};
