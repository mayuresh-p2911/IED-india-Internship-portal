export const ROLE_NAV = {
  admin: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
      { id: 'analytics',     icon: 'bar-chart-2',      label: 'Analytics' },
    ]},
    { section: 'Management', items: [
      { id: 'users',         icon: 'users',            label: 'User Management' },
      { id: 'applications',  icon: 'file-text',        label: 'Applications' },
      { id: 'intern-referrals', icon: 'user-plus',     label: 'Intern Referrals' },
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
    { section: 'Finance', items: [
      { id: 'pricing',              icon: 'settings',      label: 'Pricing & Fees' },
      { id: 'payment-transactions', icon: 'credit-card',   label: 'Payments' },
      { id: 'referral-partners',    icon: 'users',         label: 'Referral Partners' },
      { id: 'payout-management',    icon: 'wallet',        label: 'Payouts' },
    ]},
  ],
  hr: [
    { section: 'Main', items: [
      { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
      { id: 'analytics',     icon: 'bar-chart-2',      label: 'Analytics' },
    ]},
    { section: 'Recruitment', items: [
      { id: 'applications',  icon: 'file-text',        label: 'Applications' },
      { id: 'intern-referrals', icon: 'user-plus',     label: 'Intern Referrals' },
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
    { section: 'Referrals', items: [
      { id: 'refer-intern',  icon: 'user-plus',        label: 'Refer an Intern' },
      { id: 'my-referrals',  icon: 'clipboard-list',   label: 'My Referrals' },
    ]},
  ],
  referral_partner: [
    { section: 'Main', items: [
      { id: 'dashboard',        icon: 'layout-dashboard', label: 'Dashboard' },
    ]},
    { section: 'Referrals', items: [
      { id: 'rp-referrals',     icon: 'users',           label: 'My Referrals' },
    ]},
    { section: 'Payouts', items: [
      { id: 'rp-payouts',       icon: 'wallet',          label: 'Payouts & Commissions' },
    ]},
  ]
};

export const MODULE_TITLES = {
  dashboard: 'Dashboard', analytics: 'Analytics', users: 'User Management',
  applications: 'Applications', 'intern-referrals': 'Intern Referrals',
  'refer-intern': 'Refer an Intern', 'my-referrals': 'My Referrals',
  interviews: 'Interviews', onboarding: 'Onboarding',
  attendance: 'Attendance', tasks: 'Tasks', leaves: 'Leave Management',
  communication: 'Messages', evaluation: 'Evaluations', certificates: 'Certificates',
  pricing: 'Pricing & Fees', 'payment-transactions': 'Payment Transactions',
  'referral-partners': 'Referral Partners', 'payout-management': 'Payout Management',
  'rp-referrals': 'My Referrals', 'rp-payouts': 'Payouts & Commissions',
};
