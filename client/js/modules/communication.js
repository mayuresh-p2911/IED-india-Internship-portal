// ═══════════════════════════════════════════════════════════
// IED India IMS — Communication Module (Messages + Announcements)
// ═══════════════════════════════════════════════════════════

window.CommunicationModule = {
  _activeTab: 'messages',
  _selectedUser: null,
  _pollInterval: null,

  render: async () => {
    const content = document.getElementById('page-content');
    if (CommunicationModule._pollInterval) { clearInterval(CommunicationModule._pollInterval); }
    content.innerHTML = `
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border-color);margin-bottom:20px">
        <button class="tab-btn ${CommunicationModule._activeTab==='messages'?'active':''}" data-tab="messages" onclick="CommunicationModule.switchTab('messages')" style="padding:10px 24px;background:none;border:none;cursor:pointer;font-family:var(--font-body);font-size:0.875rem;font-weight:600;color:${CommunicationModule._activeTab==='messages'?'var(--accent-blue)':'var(--text-muted)'};border-bottom:2px solid ${CommunicationModule._activeTab==='messages'?'var(--accent-blue)':'transparent'}">
          <i data-lucide="message-square" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"></i>Messages
        </button>
        <button class="tab-btn ${CommunicationModule._activeTab==='announcements'?'active':''}" data-tab="announcements" onclick="CommunicationModule.switchTab('announcements')" style="padding:10px 24px;background:none;border:none;cursor:pointer;font-family:var(--font-body);font-size:0.875rem;font-weight:600;color:${CommunicationModule._activeTab==='announcements'?'var(--accent-blue)':'var(--text-muted)'};border-bottom:2px solid ${CommunicationModule._activeTab==='announcements'?'var(--accent-blue)':'transparent'}">
          <i data-lucide="bell" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"></i>Announcements
        </button>
      </div>
      <div id="tab-content"></div>`;
    lucide.createIcons();
    if (CommunicationModule._activeTab === 'messages') {
      await CommunicationModule._renderMessages();
    } else {
      await CommunicationModule._renderAnnouncements();
    }
  },

  switchTab: async (tab) => {
    CommunicationModule._activeTab = tab;
    if (CommunicationModule._pollInterval) { clearInterval(CommunicationModule._pollInterval); }
    CommunicationModule.render();
  },

  _renderMessages: async () => {
    const tabContent = document.getElementById('tab-content');
    tabContent.innerHTML = renderLoading();
    try {
      const [convsData, usersData] = await Promise.all([
        API.get('/messages/conversations'),
        API.get('/users')
      ]);
      const convs = convsData.conversations || [];
      const users = usersData.users || [];
      const me = Auth.user._id;

      tabContent.innerHTML = `
        <div class="chat-layout glass-card">
          <div class="chat-list">
            <div style="padding:12px;border-bottom:1px solid var(--border-color)">
              <div class="search-input"><i data-lucide="search"></i><input type="text" placeholder="Search users..." oninput="CommunicationModule.filterUsers(event)" /></div>
            </div>
            <div id="user-list">
              ${users.filter(u=>u._id!==me).map(u => {
                const conv = convs.find(c=>c.partner._id===u._id);
                const avatarContent = u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : getInitials(u.name);
                return `<div class="chat-list-item ${CommunicationModule._selectedUser?._id===u._id?'active':''}" onclick="CommunicationModule.selectUser(${JSON.stringify(u).replace(/"/g,'&quot;')})">
                  <div class="avatar">${avatarContent}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${u.role} · ${u.department||''}</div>
                    ${conv?.lastMessage ? `<div style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${conv.lastMessage.content?.slice(0,30)}</div>` : ''}
                  </div>
                  ${conv?.unread > 0 ? `<span style="background:var(--accent-red);color:white;font-size:0.65rem;padding:2px 6px;border-radius:20px;font-weight:700">${conv.unread}</span>` : ''}
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="chat-area">
            <div id="chat-area-content" style="display:flex;flex-direction:column;flex:1;height:100%;min-height:0;">
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;color:var(--text-muted)">
                <i data-lucide="message-square" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px"></i>
                <p>Select a user to start chatting</p>
              </div>
            </div>
          </div>
        </div>`;
      lucide.createIcons();

      if (CommunicationModule._selectedUser) {
        await CommunicationModule.selectUser(CommunicationModule._selectedUser);
      }
    } catch(err) { tabContent.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  selectUser: async (user) => {
    CommunicationModule._selectedUser = typeof user === 'string' ? JSON.parse(user) : user;
    const u = CommunicationModule._selectedUser;
    if (CommunicationModule._pollInterval) clearInterval(CommunicationModule._pollInterval);

    // Update active state
    document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.chat-list-item').forEach(el => {
      if (el.textContent.includes(u.name)) el.classList.add('active');
    });

    // On mobile: slide the chat area into view
    const layout = document.querySelector('.chat-layout');
    if (layout) layout.classList.add('chat-open');

    // Render the layout once
    const areaContent = document.getElementById('chat-area-content');
    if (areaContent) {
      const headerAvatar = u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : getInitials(u.name);
      areaContent.innerHTML = `
        <div class="chat-header">
          <button class="chat-back-btn" onclick="CommunicationModule.goBackToList()" title="Back to conversations">
            <i data-lucide="arrow-left" style="width:18px;height:18px"></i> Back
          </button>
          <div class="avatar">${headerAvatar}</div>
          <div><strong>${u.name}</strong><div style="font-size:0.75rem;color:var(--text-muted)">${u.role} · ${u.department||''}</div></div>
        </div>
        <div class="chat-messages" id="chat-msgs">
          <div class="loading"><div class="spinner"></div></div>
        </div>
        <div class="chat-input-area">
          <input type="file" id="msg-attachment" style="display:none" onchange="CommunicationModule.handleAttachmentSelect(event)" accept="image/*,video/*,.pdf,.doc,.docx" />
          <button class="btn btn-ghost" onclick="document.getElementById('msg-attachment').click()"><i data-lucide="paperclip"></i></button>
          <div id="attachment-preview" style="display:none;align-items:center;background:#f0f4f8;padding:4px 8px;border-radius:12px;font-size:0.75rem;margin-right:8px">
            <span id="attachment-name" style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
            <i data-lucide="x" style="width:14px;height:14px;cursor:pointer;margin-left:4px" onclick="CommunicationModule.clearAttachment()"></i>
          </div>
          <input type="text" id="msg-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')CommunicationModule.sendMessage()" />
          <button class="btn btn-primary" onclick="CommunicationModule.sendMessage()"><i data-lucide="send"></i></button>
        </div>`;
      lucide.createIcons();
    }

    await CommunicationModule._loadMessages(u, true);
    CommunicationModule._pollInterval = setInterval(() => CommunicationModule._loadMessages(u, false), 3000);
  },

  _loadMessages: async (u, shouldScroll = false) => {
    const msgsEl = document.getElementById('chat-msgs');
    if (!msgsEl) return;
    try {
      const data = await API.get(`/messages?withUser=${u._id}`);
      const msgs = data.messages || [];
      const me = Auth.user._id;

      // Avoid re-rendering if nothing changed (prevents image flickering and high CPU usage)
      const lastMsgCount = msgsEl.getAttribute('data-msg-count');
      const lastMsgTime = msgsEl.getAttribute('data-last-time');
      const currentMsgCount = msgs.length;
      const currentLastTime = msgs.length ? msgs[msgs.length - 1].createdAt : '';

      if (lastMsgCount === String(currentMsgCount) && lastMsgTime === currentLastTime && !shouldScroll) {
        return;
      }

      msgsEl.setAttribute('data-msg-count', currentMsgCount);
      msgsEl.setAttribute('data-last-time', currentLastTime);

      const messagesHtml = msgs.length ? msgs.map(m => {
        const isMine = m.senderId?._id === me || m.senderId === me;
        let attachmentHtml = '';
        if (m.attachment) {
          const ext = m.attachment.split('.').pop().toLowerCase();
          const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
          const isVideo = ['mp4','webm','ogg'].includes(ext);
          if (isImage) {
            attachmentHtml = `<img src="${m.attachment}" onload="const el = document.getElementById('chat-msgs'); if (el) { el.scrollTop = el.scrollHeight; }" style="max-width:200px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer" onclick="window.open('${m.attachment}','_blank')" />`;
          } else if (isVideo) {
            attachmentHtml = `<video src="${m.attachment}" onloadedmetadata="const el = document.getElementById('chat-msgs'); if (el) { el.scrollTop = el.scrollHeight; }" controls style="max-width:200px;border-radius:8px;margin-bottom:8px;display:block"></video>`;
          } else {
            attachmentHtml = `<a href="${m.attachment}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:8px 12px;background:rgba(0,0,0,0.05);border-radius:8px;text-decoration:none;color:inherit;margin-bottom:8px"><i data-lucide="file" style="width:16px;height:16px"></i> Download File</a>`;
          }
        }
        const sender = isMine ? Auth.user : (typeof m.senderId === 'object' && m.senderId ? m.senderId : u);
        const avatarHtml = `<div class="avatar" style="width:28px;height:28px;font-size:0.65rem;flex-shrink:0;${sender?.photo ? 'background:none' : ''}">${sender?.photo ? `<img src="${sender.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : getInitials(sender?.name || '?')}</div>`;
        return `<div class="msg-container ${isMine ? 'msg-right' : 'msg-left'}" style="display:flex;gap:8px;max-width:75%;align-self:${isMine ? 'flex-end' : 'flex-start'};flex-direction:${isMine ? 'row-reverse' : 'row'};align-items:flex-start">
          ${avatarHtml}
          <div class="msg-wrapper ${isMine ? 'msg-right' : 'msg-left'}" style="max-width:100%;align-items:${isMine ? 'flex-end' : 'flex-start'}">
            <div class="chat-msg ${isMine ? 'me' : 'other'}">
              ${attachmentHtml}
              ${m.content ? `<span>${m.content}</span>` : ''}
            </div>
            <div class="chat-msg-time" style="align-self:${isMine ? 'flex-end' : 'flex-start'}">${timeAgo(m.createdAt)}</div>
          </div>
        </div>`;
      }).join('') : `<div style="text-align:center;color:var(--text-muted);padding:32px">No messages yet. Say hello! 👋</div>`;

      const wasAtBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 100;

      msgsEl.innerHTML = messagesHtml;
      lucide.createIcons();

      if (shouldScroll || wasAtBottom) {
        // Scroll immediately
        msgsEl.scrollTop = msgsEl.scrollHeight;
        // Scroll again after browser reflow to handle rendering delay
        setTimeout(() => { msgsEl.scrollTop = msgsEl.scrollHeight; }, 30);
        setTimeout(() => { msgsEl.scrollTop = msgsEl.scrollHeight; }, 150);
      }
    } catch(err) { console.error('Error polling messages:', err); }
  },

  sendMessage: async () => {
    const input = document.getElementById('msg-input');
    const fileInput = document.getElementById('msg-attachment');
    const content = input?.value?.trim() || '';
    const file = fileInput?.files?.[0];
    
    if (!content && !file) return;
    if (!CommunicationModule._selectedUser) return;
    
    try {
      if (file) {
        const fd = new FormData();
        fd.append('receiverId', CommunicationModule._selectedUser._id);
        fd.append('content', content);
        fd.append('attachment', file);
        await API.upload('/messages', fd);
      } else {
        await API.post('/messages', { receiverId: CommunicationModule._selectedUser._id, content });
      }
      
      input.value = '';
      CommunicationModule.clearAttachment();
      await CommunicationModule._loadMessages(CommunicationModule._selectedUser, true);
    } catch(err) { showToast(err.message, 'error'); }
  },

  handleAttachmentSelect: (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('attachment-preview');
    const nameEl = document.getElementById('attachment-name');
    if (file && preview && nameEl) {
      nameEl.textContent = file.name;
      preview.style.display = 'flex';
      lucide.createIcons();
    } else {
      CommunicationModule.clearAttachment();
    }
  },

  clearAttachment: () => {
    const fileInput = document.getElementById('msg-attachment');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('attachment-preview');
    if (preview) preview.style.display = 'none';
  },

  goBackToList: () => {
    const layout = document.querySelector('.chat-layout');
    if (layout) layout.classList.remove('chat-open');
    if (CommunicationModule._pollInterval) clearInterval(CommunicationModule._pollInterval);
    CommunicationModule._pollInterval = null;
  },

  filterUsers: (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.chat-list-item').forEach(el => {
      el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  _renderAnnouncements: async () => {
    const tabContent = document.getElementById('tab-content');
    tabContent.innerHTML = renderLoading();
    try {
      const data = await API.get('/announcements');
      const anns = data.announcements || [];
      const canCreate = Auth.is('admin', 'hr');

      tabContent.innerHTML = `
        <div class="page-header" style="margin-bottom:16px">
          <div><h4>Notice Board</h4></div>
          ${canCreate ? `<button class="btn btn-primary" onclick="CommunicationModule.showAnnouncementModal()"><i data-lucide="plus"></i> Post Announcement</button>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          ${anns.length ? anns.map(a => `
            <div class="glass-card" style="padding:20px;${a.isPinned?'border-color:rgba(255,215,0,0.3);background:rgba(255,215,0,0.05)':''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <h4 style="color:${a.isPinned?'var(--accent-gold)':'var(--text-primary)'}">${a.isPinned?'📌 ':''}${a.title}</h4>
                <div style="display:flex;gap:8px;align-items:center">
                  <span class="status-badge badge-${a.targetRole}">${a.targetRole}</span>
                  ${canCreate ? `<button class="btn btn-danger btn-sm btn-icon" onclick="CommunicationModule.deleteAnnouncement('${a._id}')"><i data-lucide="trash-2"></i></button>` : ''}
                </div>
              </div>
              <p style="color:var(--text-secondary);margin-bottom:12px;line-height:1.7">${a.content}</p>
              <div style="font-size:0.78rem;color:var(--text-muted)">
                Posted by <strong>${a.postedBy?.name||'System'}</strong> · ${timeAgo(a.createdAt)}
              </div>
            </div>`).join('')
          : `<div class="empty-state"><div class="empty-icon">📢</div><h3>No announcements yet</h3><p>Check back later for updates</p></div>`}
        </div>`;
      lucide.createIcons();
    } catch(err) { tabContent.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  showAnnouncementModal: () => {
    showModal('Post Announcement', `
      <form id="ann-form" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label>Title *</label><input type="text" name="title" required placeholder="Announcement title" /></div>
        <div class="form-group"><label>Content *</label><textarea name="content" rows="4" required placeholder="Write your announcement..."></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Target Audience</label>
            <select name="targetRole">
              <option value="all">All Users</option><option value="intern">Interns Only</option>
              <option value="mentor">Mentors Only</option><option value="hr">HR Only</option>
            </select>
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" name="isPinned" style="width:auto"> 📌 Pin this announcement
            </label>
          </div>
        </div>
      </form>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="CommunicationModule.postAnnouncement()"><i data-lucide="send"></i> Post</button>`
    );
  },

  postAnnouncement: async () => {
    const form = document.getElementById('ann-form');
    if (!form?.checkValidity()) { form?.reportValidity(); return; }
    const fd = new FormData(form);
    const body = { title: fd.get('title'), content: fd.get('content'), targetRole: fd.get('targetRole'), isPinned: !!fd.get('isPinned') };
    try {
      await API.post('/announcements', body);
      showToast('Announcement posted!', 'success');
      closeModal();
      CommunicationModule._renderAnnouncements();
    } catch(err) { showToast(err.message, 'error'); }
  },

  deleteAnnouncement: async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await API.delete(`/announcements/${id}`);
      showToast('Deleted successfully', 'success');
      CommunicationModule._renderAnnouncements();
    } catch(err) { showToast(err.message, 'error'); }
  }
};
