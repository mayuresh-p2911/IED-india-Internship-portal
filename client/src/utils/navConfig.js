export const ROLE_NAV = {
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

export const MODULE_TITLES = {
  dashboard: 'Dashboard', analytics: 'Analytics', users: 'User Management',
  applications: 'Applications', interviews: 'Interviews', onboarding: 'Onboarding',
  attendance: 'Attendance', tasks: 'Tasks', leaves: 'Leave Management',
  communication: 'Messages', evaluation: 'Evaluations', certificates: 'Certificates',
};
