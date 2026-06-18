import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV } from '../../utils/navConfig';
import DynamicIcon from '../DynamicIcon';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

export function Sidebar({
  currentModule,
  onNavigate,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  unreadMessages = 0
}) {
  const { user } = useAuth();
  if (!user) return null;

  const navConfig = ROLE_NAV[user.role] || [];
  const initials = getInitials(user.name);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img
            src="/img/bluelogo.png"
            alt="IED India"
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
          />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-name">IED India</span>
          <span className="sidebar-sub">IMS Portal</span>
        </div>
        <button
          className="sidebar-collapse-btn"
          id="sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="sidebar-user" id="sidebar-user">
        <div className="sidebar-avatar" id="sidebar-avatar">
          {user.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name" id="sidebar-username">
            {user.name}
          </span>
          <span className={`sidebar-user-role badge badge-${user.role}`} id="sidebar-role">
            {user.role?.toUpperCase()}
          </span>
        </div>
        <ChevronDown size={16} className="sidebar-user-chev" />
      </div>

      <nav className="sidebar-nav" id="sidebar-nav">
        {navConfig.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="sidebar-nav-section">{section.section}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${item.id === currentModule ? 'active' : ''}`}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
              >
                <DynamicIcon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.id === 'communication' && unreadMessages > 0 && (
                  <span className="nav-badge" id="msg-badge">
                    {unreadMessages}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
