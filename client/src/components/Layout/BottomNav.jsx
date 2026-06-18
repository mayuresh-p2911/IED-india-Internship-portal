import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV } from '../../utils/navConfig';
import DynamicIcon from '../DynamicIcon';

const BOTTOM_NAV_MAX = 5;

export function BottomNav({ currentModule, onNavigate, unreadMessages = 0 }) {
  const { user } = useAuth();
  if (!user) return null;

  const navConfig = ROLE_NAV[user.role] || [];
  const allItems = navConfig.flatMap(s => s.items);

  const priority = [
    'dashboard',
    'tasks',
    'attendance',
    'communication',
    'leaves',
    'applications',
    'users',
    'evaluation',
    'analytics'
  ];

  // Sort and limit bottom nav items
  const sorted = [
    ...priority
      .filter(id => allItems.some(i => i.id === id))
      .map(id => allItems.find(i => i.id === id)),
    ...allItems.filter(i => !priority.includes(i.id))
  ].slice(0, BOTTOM_NAV_MAX);

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {sorted.map(item => {
        const isActive = item.id === currentModule;
        const cleanLabel = item.label
          .replace('Management', '')
          .replace('Requests', '')
          .trim();

        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            data-module={item.id}
            onClick={() => onNavigate(item.id)}
          >
            <DynamicIcon name={item.icon} size={20} />
            <span>{cleanLabel}</span>
            {item.id === 'communication' && unreadMessages > 0 && (
              <span className="bottom-nav-dot" id="bottom-msg-dot"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
