import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MODULE_TITLES } from '../../utils/navConfig';
import { Menu, Bell, UserPen, KeyRound, LogOut } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

export function Topbar({
  currentModule,
  onNavigate,
  onOpenMobileMenu,
  unreadMessages = 0,
  onEditProfile,
  onChangePassword,
  isCollapsed
}) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user ? getInitials(user.name) : 'A';
  const title = MODULE_TITLES[currentModule] || currentModule;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setDropdownOpen(false);
    onEditProfile();
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    onChangePassword();
  };

  if (!user) return null;

  return (
    <header className={`topbar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="menu-toggle" id="menu-toggle" onClick={onOpenMobileMenu}>
        <Menu size={20} />
      </button>
      
      <div className="topbar-title" id="topbar-title">
        {title}
      </div>

      <div className="topbar-actions">
        <button
          className="topbar-btn"
          id="notif-btn"
          title="Notifications"
          onClick={() => onNavigate('communication')}
        >
          <Bell size={20} />
          {unreadMessages > 0 && (
            <span className="notif-badge" id="notif-badge">
              {unreadMessages}
            </span>
          )}
        </button>

        <div className="topbar-user" id="topbar-user-wrap" ref={dropdownRef}>
          <div
            className="topbar-avatar"
            id="topbar-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
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

          {dropdownOpen && (
            <div className="profile-dropdown" id="profile-dropdown" style={{ display: 'block' }}>
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar" id="dropdown-avatar">
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
                <div className="profile-dropdown-info">
                  <span className="profile-dropdown-name" id="dropdown-name">
                    {user.name}
                  </span>
                  <span className="profile-dropdown-email" id="dropdown-email">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="profile-dropdown-divider"></div>
              
              <button
                className="profile-dropdown-item"
                id="dropdown-edit-profile"
                onClick={handleEditProfile}
              >
                <UserPen size={16} />
                <span>Edit Profile</span>
              </button>
              
              <button
                className="profile-dropdown-item"
                id="dropdown-change-password"
                onClick={handleChangePassword}
              >
                <KeyRound size={16} />
                <span>Change Password</span>
              </button>
              
              <div className="profile-dropdown-divider"></div>
              
              <button
                className="profile-dropdown-item danger"
                id="dropdown-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
