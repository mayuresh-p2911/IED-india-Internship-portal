import * as Icons from 'lucide-react';

export function DynamicIcon({ name, ...props }) {
  if (!name) return null;
  // Convert kebab-case (e.g., 'layout-dashboard') to PascalCase (e.g., 'LayoutDashboard')
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Fallback map for special cases or if translation fails
  const specialMap = {
    'edit-2': 'Edit2',
    'bar-chart-2': 'BarChart2',
    'user-pen': 'UserPen',
    'key-round': 'KeyRound',
  };

  const nameToUse = specialMap[name] || pascalName;
  const IconComponent = Icons[nameToUse] || Icons[name] || Icons.HelpCircle || Icons.CircleHelp;
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}

export default DynamicIcon;
