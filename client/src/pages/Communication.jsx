import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { getInitials, timeAgo } from '../utils/helpers';
import {
  MessageSquare,
  Bell,
  Search,
  ArrowLeft,
  Paperclip,
  Send,
  X,
  Plus,
  Trash2,
  File,
  Pin
} from 'lucide-react';

export function Communication() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('messages');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Loaders
  const [listLoading, setListLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  // Form states
  const [search, setSearch] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Announcement modal
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    isPinned: false
  });

  const chatMsgsRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const me = user?._id;
  const canCreateAnn = is('admin', 'hr');

  // Fetch conversations and users
  const loadConversationsAndUsers = async () => {
    setListLoading(true);
    try {
      const [convsData, usersData] = await Promise.all([
        API.get('/messages/conversations'),
        API.get('/users')
      ]);
      setConversations(convsData.conversations || []);
      setUsers(usersData.users || []);
    } catch (err) {
      showToast(err.message || 'Failed to load conversations', 'error');
    } finally {
      setListLoading(false);
    }
  };

  // Fetch announcements
  const loadAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const data = await API.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      showToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Load chat messages
  const loadMessages = async (partnerId, shouldScroll = false) => {
    try {
      const data = await API.get(`/messages?withUser=${partnerId}`);
      const newMsgs = data.messages || [];
      
      setMessages(newMsgs);

      if (shouldScroll) {
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatMsgsRef.current) {
        chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
      }
    }, 50);
  };

  // Switch tabs
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    if (activeTab === 'messages') {
      loadConversationsAndUsers();
    } else {
      loadAnnouncements();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeTab]);

  // Start polling messages when a user is selected
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    if (selectedUser) {
      loadMessages(selectedUser._id, true);
      pollIntervalRef.current = setInterval(() => {
        loadMessages(selectedUser._id, false);
      }, 3000);
    } else {
      setMessages([]);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!msgInput.trim() && !attachment) return;
    if (!selectedUser) return;

    try {
      if (attachment) {
        const fd = new FormData();
        fd.append('receiverId', selectedUser._id);
        fd.append('content', msgInput.trim());
        fd.append('attachment', attachment);
        await API.upload('/messages', fd);
      } else {
        await API.post('/messages', { receiverId: selectedUser._id, content: msgInput.trim() });
      }

      setMsgInput('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await loadMessages(selectedUser._id, true);
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await API.post('/announcements', annForm);
      showToast('Announcement posted!', 'success');
      setAnnModalOpen(false);
      loadAnnouncements();
    } catch (err) {
      showToast(err.message || 'Failed to post announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await API.delete(`/announcements/${id}`);
      showToast('Deleted successfully', 'success');
      loadAnnouncements();
    } catch (err) {
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  const renderAttachment = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

    if (isImage) {
      return (
        <img
          src={url}
          alt="Attachment"
          onLoad={scrollToBottom}
          style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '8px', display: 'block', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')}
        />
      );
    } else if (isVideo) {
      return (
        <video
          src={url}
          onLoadedMetadata={scrollToBottom}
          controls
          style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '8px', display: 'block' }}
        ></video>
      );
    } else {
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            marginBottom: '8px'
          }}
        >
          <File size={16} /> Download File
        </a>
      );
    }
  };

  // Filter list of users based on search
  const filteredUsers = users.filter((u) => {
    if (u._id === me) return false;
    if (!search.trim()) return true;
    const n = u.name?.toLowerCase() || '';
    const r = u.role?.toLowerCase() || '';
    const d = u.department?.toLowerCase() || '';
    const q = search.toLowerCase();
    return n.includes(q) || r.includes(q) || d.includes(q);
  });

  return (
    <>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '10px 24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'messages' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: `2px solid ${activeTab === 'messages' ? 'var(--accent-blue)' : 'transparent'}`
          }}
        >
          <MessageSquare size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          Messages
        </button>
        <button
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
          style={{
            padding: '10px 24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'announcements' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: `2px solid ${activeTab === 'announcements' ? 'var(--accent-blue)' : 'transparent'}`
          }}
        >
          <Bell size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          Announcements
        </button>
      </div>

      <div id="tab-content">
        {/* ═══════════════════════════════════════════════════════════
            MESSAGES VIEW
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'messages' && (
          <div className={`chat-layout glass-card ${selectedUser ? 'chat-open' : ''}`}>
            <div className="chat-list">
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="search-input" style={{ display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div id="user-list" style={{ overflowY: 'auto', flex: 1 }}>
                {listLoading ? (
                  <div className="loading" style={{ padding: '20px' }}><div className="spinner"></div></div>
                ) : (
                  filteredUsers.map((u) => {
                    const conv = conversations.find((c) => c.partner?._id === u._id);
                    const isSelected = selectedUser?._id === u._id;
                    return (
                      <div
                        key={u._id}
                        className={`chat-list-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedUser(u)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="avatar">
                          {u.photo ? (
                            <img src={u.photo} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            getInitials(u.name)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.role} · {u.department || ''}
                          </div>
                          {conv?.lastMessage && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {conv.lastMessage.content?.slice(0, 30)}
                            </div>
                          )}
                        </div>
                        {conv?.unread > 0 && (
                          <span style={{ backgroundColor: 'var(--accent-red)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '20px', fontWeight: 700 }}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="chat-area">
              {selectedUser ? (
                <div id="chat-area-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
                  <div className="chat-header">
                    <button className="chat-back-btn" onClick={() => setSelectedUser(null)} title="Back to conversations">
                      <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back
                    </button>
                    <div className="avatar">
                      {selectedUser.photo ? (
                        <img src={selectedUser.photo} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        getInitials(selectedUser.name)
                      )}
                    </div>
                    <div>
                      <strong>{selectedUser.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {selectedUser.role} · {selectedUser.department || ''}
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages" id="chat-msgs" ref={chatMsgsRef} style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.length ? (
                      messages.map((m) => {
                        const isMine = m.senderId?._id === me || m.senderId === me;
                        const sender = isMine ? user : m.senderId === me ? selectedUser : m.senderId || selectedUser;
                        return (
                          <div
                            key={m._id}
                            className={`msg-container ${isMine ? 'msg-right' : 'msg-left'}`}
                            style={{
                              display: 'flex',
                              gap: '8px',
                              maxWidth: '75%',
                              alignSelf: isMine ? 'flex-end' : 'flex-start',
                              flexDirection: isMine ? 'row-reverse' : 'row',
                              alignItems: 'flex-start'
                            }}
                          >
                            <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.65rem', flexShrink: 0 }}>
                              {sender?.photo ? (
                                <img src={sender.photo} alt={sender.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              ) : (
                                getInitials(sender?.name || '?')
                              )}
                            </div>
                            <div className={`msg-wrapper ${isMine ? 'msg-right' : 'msg-left'}`} style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                              <div className={`chat-msg ${isMine ? 'me' : 'other'}`}>
                                {renderAttachment(m.attachment)}
                                {m.content && <span>{m.content}</span>}
                              </div>
                              <div className="chat-msg-time" style={{ alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                                {timeAgo(m.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                        No messages yet. Say hello! 👋
                      </div>
                    )}
                  </div>

                  <form className="chat-input-area" onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', padding: '12px' }}>
                    <input
                      type="file"
                      id="msg-attachment"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleAttachmentChange}
                      accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                    <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip size={16} />
                    </button>
                    {attachment && (
                      <div
                        id="attachment-preview"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#f0f4f8',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          marginRight: '8px'
                        }}
                      >
                        <span id="attachment-name" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attachment.name}
                        </span>
                        <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => setAttachment(null)} />
                      </div>
                    )}
                    <input
                      type="text"
                      id="msg-input"
                      placeholder="Type a message..."
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      style={{ flex: 1, marginRight: '8px' }}
                    />
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', height: '100%' }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>Select a user to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ANNOUNCEMENTS VIEW
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'announcements' && (
          <>
            <div className="page-header" style={{ marginBottom: '16px' }}>
              <div>
                <h4>Notice Board</h4>
              </div>
              {canCreateAnn && (
                <button className="btn btn-primary" onClick={() => setAnnModalOpen(true)}>
                  <Plus size={16} /> Post Announcement
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {announcementsLoading ? (
                <div className="loading" style={{ padding: '40px' }}><div className="spinner"></div></div>
              ) : announcements.length ? (
                announcements.map((a) => (
                  <div
                    className="glass-card"
                    key={a._id}
                    style={{
                      padding: '20px',
                      borderColor: a.isPinned ? 'rgba(255,215,0,0.3)' : 'var(--border-color)',
                      backgroundColor: a.isPinned ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ color: a.isPinned ? 'var(--accent-gold)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {a.isPinned && <Pin size={16} style={{ color: 'var(--accent-gold)' }} />}
                        {a.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`status-badge badge-${a.targetRole}`}>{a.targetRole}</span>
                        {canCreateAnn && (
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeleteAnnouncement(a._id)}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.7 }}>
                      {a.content}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Posted by <strong>{a.postedBy?.name || 'System'}</strong> · {timeAgo(a.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📢</div>
                  <h3>No announcements yet</h3>
                  <p>Check back later for updates</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Post Announcement Modal */}
      {annModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAnnModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Post Announcement</h3>
              <button className="modal-close" onClick={() => setAnnModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePostAnnouncement}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Announcement title"
                      value={annForm.title}
                      onChange={(e) => setAnnForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Content *</label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Write your announcement..."
                      value={annForm.content}
                      onChange={(e) => setAnnForm((prev) => ({ ...prev, content: e.target.value }))}
                    ></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Target Audience</label>
                      <select
                        value={annForm.targetRole}
                        onChange={(e) => setAnnForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                      >
                        <option value="all">All Users</option>
                        <option value="intern">Interns Only</option>
                        <option value="mentor">Mentors Only</option>
                        <option value="hr">HR Only</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ justifyContent: 'flex-end', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={annForm.isPinned}
                          onChange={(e) => setAnnForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                          style={{ width: 'auto' }}
                        />{' '}
                        📌 Pin this announcement
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setAnnModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={12} style={{ marginRight: '4px' }} /> Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Communication;
