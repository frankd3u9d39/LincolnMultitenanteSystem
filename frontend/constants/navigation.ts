export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin';

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'neutral';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface RoleNavigationConfig {
  role: UserRole;
  roleLabel: string;
  roleBadge: string;
  roleColor: {
    bg: string;
    text: string;
    border: string;
  };
  groups: NavGroup[];
}

export const ROLE_NAVIGATION: Record<UserRole, RoleNavigationConfig> = {
  admin: {
    role: 'admin',
    roleLabel: 'School Administrator',
    roleBadge: 'Admin',
    roleColor: {
      bg: 'bg-red-600/15',
      text: 'text-red-500',
      border: 'border-red-600/30',
    },
    groups: [
      {
        label: 'Overview',
        items: [
          { title: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
          { title: 'School Reports', href: '/reports', iconName: 'chart' },
          { title: 'Announcements', href: '/announcements', iconName: 'bell' },
        ],
      },
      {
        label: 'People Management',
        items: [
          { title: 'Students', href: '/students', iconName: 'students', badge: '1.2k' },
          { title: 'Teachers', href: '/teachers', iconName: 'teachers', badge: '84' },
          { title: 'Staff Roster', href: '/staff', iconName: 'users' },
        ],
      },
      {
        label: 'Academic Operations',
        items: [
          { title: 'Classes', href: '/classes', iconName: 'classes' },
          { title: 'Departments', href: '/departments', iconName: 'building' },
          { title: 'Courses', href: '/courses', iconName: 'book' },
          { title: 'Subjects', href: '/subjects', iconName: 'layers' },
          { title: 'Academic Sessions', href: '/sessions', iconName: 'calendar' },
          { title: 'Attendance', href: '/attendance', iconName: 'checkCircle' },
          { title: 'Examinations', href: '/examinations', iconName: 'clipboard' },
          { title: 'Results', href: '/results', iconName: 'award' },
        ],
      },
      {
        label: 'Administration',
        items: [
          { title: 'Fee Management', href: '/fees', iconName: 'creditCard' },
          { title: 'School Settings', href: '/school-settings', iconName: 'sliders' },
          { title: 'General Settings', href: '/settings', iconName: 'cog' },
        ],
      },
    ],
  },

  teacher: {
    role: 'teacher',
    roleLabel: 'Teacher',
    roleBadge: 'Teachers',
    roleColor: {
      bg: 'bg-red-600/15',
      text: 'text-red-500',
      border: 'border-red-600/30',
    },
    groups: [
      {
        label: 'Overview',
        items: [
          { title: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
          { title: 'Announcements', href: '/announcements', iconName: 'bell' },
          { title: 'My Profile', href: '/profile', iconName: 'user' },
        ],
      },
      {
        label: 'Classroom & Students',
        items: [
          { title: 'Assigned Classes', href: '/classes', iconName: 'classes', badge: '4' },
          { title: 'Student Roster', href: '/students', iconName: 'students' },
          { title: 'Attendance Roll', href: '/attendance', iconName: 'checkCircle' },
          { title: 'Timetable', href: '/timetable', iconName: 'calendar' },
        ],
      },
      {
        label: 'Academics & Grading',
        items: [
          { title: 'Assignments', href: '/assignments', iconName: 'clipboard', badge: '12', badgeVariant: 'primary' },
          { title: 'Grading & Marks', href: '/grading', iconName: 'award' },
          { title: 'Course Materials', href: '/materials', iconName: 'book' },
        ],
      },
      {
        label: 'Preferences',
        items: [
          { title: 'Settings', href: '/settings', iconName: 'cog' },
        ],
      },
    ],
  },

  student: {
    role: 'student',
    roleLabel: 'Enrolled Student',
    roleBadge: 'Student',
    roleColor: {
      bg: 'bg-red-600/15',
      text: 'text-red-500',
      border: 'border-red-600/30',
    },
    groups: [
      {
        label: 'Academic Hub',
        items: [
          { title: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
          { title: 'My Courses', href: '/courses', iconName: 'book', badge: '6' },
          { title: 'Assignments', href: '/assignments', iconName: 'clipboard', badge: '3 Due', badgeVariant: 'primary' },
          { title: 'Exam Results', href: '/results', iconName: 'award' },
          { title: 'Class Timetable', href: '/timetable', iconName: 'calendar' },
        ],
      },
      {
        label: 'Campus Life',
        items: [
          { title: 'Attendance', href: '/attendance', iconName: 'checkCircle' },
          { title: 'Fee Status', href: '/fees', iconName: 'creditCard' },
          { title: 'Notifications', href: '/notifications', iconName: 'bell', badge: '2', badgeVariant: 'primary' },
        ],
      },
      {
        label: 'Account',
        items: [
          { title: 'Student Profile', href: '/profile', iconName: 'user' },
          { title: 'Settings', href: '/settings', iconName: 'cog' },
        ],
      },
    ],
  },

  superadmin: {
    role: 'superadmin',
    roleLabel: 'Platform SuperAdmin',
    roleBadge: 'SuperAdmin',
    roleColor: {
      bg: 'bg-red-600/15',
      text: 'text-red-500',
      border: 'border-red-600/30',
    },
    groups: [
      {
        label: 'Platform Overview',
        items: [
          { title: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
          { title: 'System Reports', href: '/system-reports', iconName: 'chart' },
          { title: 'Security Audit Logs', href: '/audit-logs', iconName: 'shield' },
        ],
      },
      {
        label: 'Tenant Governance',
        items: [
          { title: 'Schools (Tenants)', href: '/schools', iconName: 'building', badge: '18 Active', badgeVariant: 'primary' },
          { title: 'School Administrators', href: '/administrators', iconName: 'users' },
          { title: 'All System Users', href: '/system-users', iconName: 'students' },
        ],
      },
      {
        label: 'Configuration',
        items: [
          { title: 'Platform Settings', href: '/platform-settings', iconName: 'sliders' },
          { title: 'Global Settings', href: '/settings', iconName: 'cog' },
        ],
      },
    ],
  },
};
