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
          { title: 'Dashboard', href: '/admin/dashboard', iconName: 'dashboard' },
          { title: 'School Reports', href: '/admin/reports', iconName: 'chart' },
          { title: 'Announcements', href: '/admin/announcements', iconName: 'bell' },
        ],
      },
      {
        label: 'People Management',
        items: [
          { title: 'Students', href: '/admin/students', iconName: 'students', badge: '1.2k' },
          { title: 'Teachers', href: '/admin/teachers', iconName: 'teachers', badge: '84' },
          { title: 'Staff Roster', href: '/admin/staff', iconName: 'users' },
        ],
      },
      {
        label: 'Academic Operations',
        items: [
          { title: 'Classes', href: '/admin/classes', iconName: 'classes' },
          { title: 'Departments', href: '/admin/departments', iconName: 'building' },
          { title: 'Courses', href: '/admin/courses', iconName: 'book' },
          { title: 'Subjects', href: '/admin/subjects', iconName: 'layers' },
          { title: 'Academic Sessions', href: '/admin/sessions', iconName: 'calendar' },
          { title: 'Attendance', href: '/admin/attendance', iconName: 'checkCircle' },
          { title: 'Examinations', href: '/admin/examinations', iconName: 'clipboard' },
          { title: 'Results', href: '/admin/results', iconName: 'award' },
        ],
      },
      {
        label: 'Administration',
        items: [
          { title: 'Fee Management', href: '/admin/fees', iconName: 'creditCard' },
          { title: 'School Settings', href: '/admin/school-settings', iconName: 'sliders' },
          { title: 'General Settings', href: '/admin/settings', iconName: 'cog' },
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
          { title: 'Dashboard', href: '/teacher/dashboard', iconName: 'dashboard' },
          { title: 'Announcements', href: '/teacher/announcements', iconName: 'bell' },
          { title: 'My Profile', href: '/teacher/profile', iconName: 'user' },
        ],
      },
      {
        label: 'Classroom & Students',
        items: [
          { title: 'Assigned Classes', href: '/teacher/classes', iconName: 'classes', badge: '4' },
          { title: 'Student Roster', href: '/teacher/students', iconName: 'students' },
          { title: 'Attendance Roll', href: '/teacher/attendance', iconName: 'checkCircle' },
          { title: 'Timetable', href: '/teacher/timetable', iconName: 'calendar' },
        ],
      },
      {
        label: 'Academics & Grading',
        items: [
          { title: 'Assignments', href: '/teacher/assignments', iconName: 'clipboard', badge: '12', badgeVariant: 'primary' },
          { title: 'Grading & Marks', href: '/teacher/grading', iconName: 'award' },
          { title: 'Course Materials', href: '/teacher/materials', iconName: 'book' },
        ],
      },
      {
        label: 'Preferences',
        items: [
          { title: 'Settings', href: '/teacher/settings', iconName: 'cog' },
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
          { title: 'Dashboard', href: '/student/dashboard', iconName: 'dashboard' },
          { title: 'My Courses', href: '/student/courses', iconName: 'book', badge: '6' },
          { title: 'Assignments', href: '/student/assignments', iconName: 'clipboard', badge: '3 Due', badgeVariant: 'primary' },
          { title: 'Exam Results', href: '/student/results', iconName: 'award' },
          { title: 'Class Timetable', href: '/student/timetable', iconName: 'calendar' },
        ],
      },
      {
        label: 'Campus Life',
        items: [
          { title: 'Attendance', href: '/student/attendance', iconName: 'checkCircle' },
          { title: 'Fee Status', href: '/student/fees', iconName: 'creditCard' },
          { title: 'Notifications', href: '/student/notifications', iconName: 'bell', badge: '2', badgeVariant: 'primary' },
        ],
      },
      {
        label: 'Account',
        items: [
          { title: 'Student Profile', href: '/student/profile', iconName: 'user' },
          { title: 'Settings', href: '/student/settings', iconName: 'cog' },
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
          { title: 'Dashboard', href: '/superadmin/dashboard', iconName: 'dashboard' },
          { title: 'System Reports', href: '/superadmin/system-reports', iconName: 'chart' },
          { title: 'Security Audit Logs', href: '/superadmin/audit-logs', iconName: 'shield' },
        ],
      },
      {
        label: 'Tenant Governance',
        items: [
          { title: 'Schools (Tenants)', href: '/superadmin/schools', iconName: 'building', badge: '18 Active', badgeVariant: 'primary' },
          { title: 'School Administrators', href: '/superadmin/administrators', iconName: 'users' },
          { title: 'All System Users', href: '/superadmin/system-users', iconName: 'students' },
        ],
      },
      {
        label: 'Configuration',
        items: [
          { title: 'Platform Settings', href: '/superadmin/platform-settings', iconName: 'sliders' },
          { title: 'Global Settings', href: '/superadmin/settings', iconName: 'cog' },
        ],
      },
    ],
  },
};
