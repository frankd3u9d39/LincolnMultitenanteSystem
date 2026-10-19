// GROUP 3: Admin Module - API integration.
//
// Every call the Admin screens make goes through here, mirroring the pattern
// used by the SuperAdmin and Student modules.

import { api } from '@/services/api';

export interface DashboardOverview {
  school: { name: string; code: string; academicYear: string | null; maxStudents: number; maxTeachers: number };
  counts: { students: number; teachers: number; classes: number; courses: number };
  outstandingFees: number;
  recentAnnouncements: Array<{ id: number; title: string; audience: string; important: boolean; date: string }>;
}

export function getDashboard(signal?: AbortSignal) {
  return api<{ data: DashboardOverview }>('/admin/dashboard', { signal }).then((r) => r.data);
}

export interface RosterStudent {
  id: number;
  name: string;
  email: string;
  status: string;
  classId?: number | null;
  className?: string | null;
  gradeLevel: string | null;
  studentIdNumber: string | null;
  joinedAt: string;
}

export function listStudents(search: string, signal?: AbortSignal) {
  return api<{ data: RosterStudent[] }>('/admin/students', { signal, query: { search, per_page: 100 } }).then((r) => r.data);
}

export function createStudent(payload: { name: string; email: string; classId?: number; gradeLevel?: string; password?: string }) {
  return api<{ data: RosterStudent }>('/admin/students', { method: 'POST', body: payload }).then((r) => r.data);
}

export function updateStudentStatus(id: number, status: string) {
  return api(`/admin/students/${id}`, { method: 'PUT', body: { status } });
}

export interface RosterTeacher {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  classCount: number;
  joinedAt: string;
}

export function listTeachers(search: string, signal?: AbortSignal) {
  return api<{ data: RosterTeacher[] }>('/admin/teachers', { signal, query: { search } }).then((r) => r.data);
}

export function createTeacher(payload: { name: string; email: string; phone?: string; password?: string }) {
  return api<{ data: RosterTeacher }>('/admin/teachers', { method: 'POST', body: payload }).then((r) => r.data);
}

export function updateTeacherStatus(id: number, status: string) {
  return api(`/admin/teachers/${id}`, { method: 'PUT', body: { status } });
}

export interface ClassSubjectItem {
  id: number;
  code: string;
  name: string;
  department?: string | null;
  teacher?: string | null;
  teacherId?: number | null;
}

export interface SchoolClassDto {
  id: number;
  name: string;
  code: string;
  room: string | null;
  schedule: string | null;
  teacher: string;
  teacherId: number | null;
  studentCount: number;
  subjects?: ClassSubjectItem[];
  subjectsCount?: number;
}

export function listClasses(signal?: AbortSignal) {
  return api<{ data: SchoolClassDto[] }>('/admin/classes', { signal }).then((r) => r.data);
}

export function createClass(payload: {
  name: string;
  code: string;
  room?: string;
  schedule?: string;
  teacherId?: number | null;
  subjectIds?: number[];
}) {
  return api<{ data: { id: number } }>('/admin/classes', { method: 'POST', body: payload }).then((r) => r.data);
}

export function syncClassSubjects(
  classId: number,
  payload: number[] | { subjectIds?: number[]; assignments?: Array<{ subjectId: number; teacherId?: number | null }> }
) {
  const body = Array.isArray(payload) ? { subjectIds: payload } : payload;
  return api<{ message: string; data: { subjects: ClassSubjectItem[] } }>(`/admin/classes/${classId}/subjects`, {
    method: 'PUT',
    body,
  });
}

export interface AdminCourse {
  id: number;
  code: string;
  name: string;
  department: string | null;
  credits: number;
  term: string;
  capacity: number;
  teacher: string;
  teacherId: number | null;
  enrolled: number;
}

export function listCourses(signal?: AbortSignal) {
  return api<{ data: AdminCourse[] }>('/admin/courses', { signal }).then((r) => r.data);
}

export function createCourse(payload: {
  code: string;
  name: string;
  department?: string;
  credits: number;
  term?: string;
  capacity: number;
  teacherId?: number | null;
}) {
  return api<{ data: { id: number } }>('/admin/courses', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface AdminFeeItem {
  id: number;
  student: string | null;
  studentId: number;
  term: string;
  description: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  dueDate: string;
}

export function listFees(signal?: AbortSignal) {
  return api<{ data: AdminFeeItem[] }>('/admin/fees', { signal, query: { per_page: 100 } }).then((r) => r.data);
}

export function createFee(payload: { studentId: number; term: string; description: string; amount: number; dueDate: string; required?: boolean }) {
  return api<{ data: { id: number } }>('/admin/fees', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface AdminAnnouncement {
  id: number;
  title: string;
  content: string;
  audience: string;
  important: boolean;
  postedBy: string | null;
  date: string;
}

export function listAnnouncements(signal?: AbortSignal) {
  return api<{ data: AdminAnnouncement[] }>('/admin/announcements', { signal }).then((r) => r.data);
}

export function createAnnouncement(payload: { title: string; content: string; audience: string; important?: boolean }) {
  return api<{ data: { id: number } }>('/admin/announcements', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface SchoolProfile {
  name: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  academicYearCurrent: string | null;
  timezone: string;
  status: string;
  maxStudents: number;
  maxTeachers: number;
}

export function getSchoolSettings(signal?: AbortSignal) {
  return api<{ data: SchoolProfile }>('/admin/school-settings', { signal }).then((r) => r.data);
}

export function updateSchoolSettings(payload: Partial<Omit<SchoolProfile, 'name' | 'code' | 'status' | 'maxStudents' | 'maxTeachers'>>) {
  return api<{ data: SchoolProfile }>('/admin/school-settings', { method: 'PUT', body: payload }).then((r) => r.data);
}

export interface AdminDepartment {
  id: number;
  name: string;
  code: string;
  head: string;
  headEmail?: string;
  coursesCount: number;
  facultyCount: number;
  studentsCount: number;
  status: string;
}

export interface DepartmentResponse {
  data: AdminDepartment[];
  summary: { totalDepartments: number; totalCourses: number; totalFaculty: number };
}

export function listDepartments(signal?: AbortSignal) {
  return api<DepartmentResponse>('/admin/departments', { signal });
}

export function createDepartment(payload: { name: string; code: string; head?: string }) {
  return api<{ data: AdminDepartment }>('/admin/departments', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface AdminSubject {
  id: number;
  code: string;
  name: string;
  department: string;
  teacher?: string | null;
  teacherId?: number | null;
  credits: number;
  type: 'Core' | 'Elective';
  term: string;
  hoursPerWeek: number;
  status: string;
}

export interface SubjectResponse {
  data: AdminSubject[];
  summary: { totalSubjects: number; coreCount: number; electiveCount: number };
}

export function listSubjects(signal?: AbortSignal) {
  return api<SubjectResponse>('/admin/subjects', { signal });
}

export function createSubject(payload: {
  code: string;
  name: string;
  department: string;
  credits: number;
  type: 'Core' | 'Elective';
  teacherId?: number | null;
}) {
  return api<{ data: AdminSubject }>('/admin/subjects', { method: 'POST', body: payload }).then((r) => r.data);
}

export function updateSubject(
  id: number,
  payload: {
    code?: string;
    name?: string;
    department?: string;
    credits?: number;
    type?: 'Core' | 'Elective';
    teacherId?: number | null;
  }
) {
  return api<{ message: string; data: Partial<AdminSubject> }>(`/admin/subjects/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export interface AcademicSession {
  id: number;
  year: string;
  term: string;
  startDate: string;
  endDate: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
  isCurrent: boolean;
  enrolledStudents: number;
  examPeriod: string;
}

export interface SessionResponse {
  data: AcademicSession[];
  currentSession: AcademicSession;
  academicYear: string;
}

export function listSessions(signal?: AbortSignal) {
  return api<SessionResponse>('/admin/sessions', { signal });
}

export function createSession(payload: { year: string; term: string; startDate: string; endDate: string }) {
  return api<{ data: AcademicSession }>('/admin/sessions', { method: 'POST', body: payload }).then((r) => r.data);
}

export function activateSession(id: number) {
  return api(`/admin/sessions/${id}/activate`, { method: 'POST' });
}

export interface AttendanceSummary {
  overallRate: number;
  totalRecorded: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  flaggedCount: number;
}

export interface ClassAttendanceRoster {
  id: number;
  course: string;
  code: string;
  department: string;
  enrolled: number;
  presentToday: number;
  rate: number;
  status: 'Normal' | 'Caution' | 'Critical Warning';
}

export interface FlaggedStudent {
  id: number;
  name: string;
  idNumber: string;
  course: string;
  rate: number;
  consecutiveAbsences: number;
}

export interface AttendanceResponse {
  summary: AttendanceSummary;
  classRosters: ClassAttendanceRoster[];
  flaggedStudents: FlaggedStudent[];
}

export function getAttendanceOverview(signal?: AbortSignal) {
  return api<AttendanceResponse>('/admin/attendance', { signal });
}

export interface ExamRecord {
  id: number;
  examCode: string;
  courseCode: string;
  courseName: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  invigilator: string;
  format: string;
  duration: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | string;
}

export interface ExamResponse {
  data: ExamRecord[];
  summary: { totalExams: number; scheduledCount: number; completedCount: number; activeVenues: number };
}

export function listExaminations(signal?: AbortSignal) {
  return api<ExamResponse>('/admin/examinations', { signal });
}

export function createExamination(payload: {
  courseCode: string;
  courseName: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  invigilator?: string;
  format: string;
  duration: string;
}) {
  return api<{ data: ExamRecord }>('/admin/examinations', { method: 'POST', body: payload }).then((r) => r.data);
}

export function updateExamStatus(id: number, status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled') {
  return api<{ message: string; data: { id: number; status: string } }>(`/admin/examinations/${id}/status`, {
    method: 'PUT',
    body: { status },
  });
}

export interface StudentRanking {
  id: number;
  name: string;
  email: string;
  idNumber: string;
  gpa: number;
  averageScore: number;
  coursesPassed: number;
  creditsEarned: number;
  standing: string;
}

export interface GpaDistributionItem {
  bracket: string;
  count: number;
  percentage: number;
}

export interface ResultOverviewResponse {
  summary: {
    campusAverageGpa: number;
    totalStudentsAssessed: number;
    passRate: string;
    honorsCount: number;
  };
  gpaDistribution: GpaDistributionItem[];
  rankings: StudentRanking[];
}

export function getResultOverview(signal?: AbortSignal) {
  return api<ResultOverviewResponse>('/admin/results', { signal });
}

export interface SchoolReportData {
  kpis: {
    totalEnrollment: number;
    totalFaculty: number;
    facultyRatio: string;
    feeCollectionRate: string;
    totalRevenue: string;
    outstandingBalances: string;
    attendanceBenchmark: string;
    courseRetentionRate: string;
  };
  enrollmentTrend: Array<{ month: string; students: number; revenue: number }>;
  departmentBreakdown: Array<{ name: string; students: number; courses: number; faculty: number; budgetUtilization: string }>;
  generatedAt: string;
}

export function getSchoolReports(signal?: AbortSignal) {
  return api<SchoolReportData>('/admin/reports', { signal });
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  roleTitle: string;
  department: string;
  phone: string;
  status: string;
  joinedDate: string;
}

export interface StaffResponse {
  data: StaffMember[];
  summary: { totalStaff: number; departments: number; activeCount: number };
}

export function listStaff(signal?: AbortSignal) {
  return api<StaffResponse>('/admin/staff', { signal });
}

export function createStaff(payload: { name: string; email: string; roleTitle: string; department: string; phone?: string; password?: string }) {
  return api<{ data: StaffMember }>('/admin/staff', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface GeneralSettingsData {
  academic: {
    gradingScale: string;
    minimumPassGrade: string;
    minAttendanceThreshold: number;
    maxCourseLoadCredits: number;
    allowSelfCourseDrop: boolean;
  };
  financial: {
    currency: string;
    lateFeeGracePeriodDays: number;
    allowPartialFeePayments: boolean;
    automaticPaymentReceipts: boolean;
  };
  notifications: {
    emailAnnouncements: boolean;
    smsAttendanceAlerts: boolean;
    examReminderDaysBefore: number;
  };
  portalBranding: {
    schoolName: string;
    campusCode: string;
    portalTheme: string;
  };
}

export function getGeneralSettings(signal?: AbortSignal) {
  return api<{ data: GeneralSettingsData }>('/admin/settings', { signal }).then((r) => r.data);
}

export function updateGeneralSettings(payload: Partial<GeneralSettingsData['academic'] & GeneralSettingsData['financial']>) {
  return api('/admin/settings', { method: 'PUT', body: payload });
}

