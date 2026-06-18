import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import API from '../../services/api';

export function DashboardLayout({
  currentModule,
  onNavigate,
  children,
  onEditProfile,
  onChangePassword
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Poll notifications
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await API.get('/messages/unread');
        setUnreadMessages(data.count || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app" style={{ display: 'flex' }}>
      {/* Sidebar overlay for mobile tap-outside-to-close */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`} 
        id="sidebar-overlay"
        onClick={() => setIsMobileOpen(false)}
      />

      <Sidebar
        currentModule={currentModule}
        onNavigate={(mod) => {
          onNavigate(mod);
          setIsMobileOpen(false);
        }}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        unreadMessages={unreadMessages}
      />

      <div className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`} id="main-content">
        <Topbar
          currentModule={currentModule}
          onNavigate={(mod) => {
            onNavigate(mod);
            setIsMobileOpen(false);
          }}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          unreadMessages={unreadMessages}
          onEditProfile={onEditProfile}
          onChangePassword={onChangePassword}
          isCollapsed={isCollapsed}
        />

        <main className="page-content" id="page-content">
          {children}
        </main>
      </div>

      <BottomNav
        currentModule={currentModule}
        onNavigate={(mod) => {
          onNavigate(mod);
          setIsMobileOpen(false);
        }}
        unreadMessages={unreadMessages}
      />
    </div>
  );
}

export default DashboardLayout;
