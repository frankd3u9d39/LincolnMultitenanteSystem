// GROUP 1: Student Module - API integration.
//
// Every call the Student screens make goes through here, mirroring the
// pattern used by the SuperAdmin module (`modules/superadmin/services/api.ts`).

import { api } from '@/services/api';

export interface DashboardOverview {
  kpi: { gpa: number; attendance: number; assignmentsDue: number; unreadNotifications: number };
  todaysClasses: Array<{ id: number; subject: string; time: string; room: string; instructor: string }>;
  recentGrades: Array<{ id: number; course: string; task: string; score: number; points: number; date: string | null }>;
  upcomingDeadlines: Array<{ id: number; course: string; task: string; due: string; urgency: 'high' | 'medium' | 'low' }>;
}

export function getDashboard(signal?: AbortSignal) {
  return api<{ data: DashboardOverview }>('/student/dashboard', { signal }).then((r) => r.data);
}

export interface EnrolledCourse {
  id: number;
  enrollmentId: number;
  name: string;
  code: string;
  instructor: string;
  credits: number;
  schedule: string;
  progress: number;
  color: string;
  status: 'In Progress' | 'Completed';
}

export function listMyCourses(signal?: AbortSignal) {
  return api<{ data: EnrolledCourse[] }>('/student/courses', { signal }).then((r) => r.data);
}

export interface CatalogCourse {
  id: number;
  name: string;
  code: string;
  instructor: string;
  credits: number;
  category: string | null;
  schedule: string;
  spots: number;
  totalSpots: number;
  color: string;
}

export function listCatalog(signal?: AbortSignal) {
  return api<{ data: CatalogCourse[] }>('/student/courses/catalog', { signal }).then((r) => r.data);
}

export function enrollInCourse(courseId: number) {
  return api<{ data: { enrollmentId: number } }>(`/student/courses/${courseId}/enroll`, { method: 'POST' }).then((r) => r.data);
}

export interface StudentAssignment {
  id: number;
  submissionId: number;
  title: string;
  course: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded' | 'Overdue';
  type: string;
  points: number;
  score: number | null;
}

export function listAssignments(signal?: AbortSignal) {
  return api<{ data: StudentAssignment[] }>('/student/assignments', { signal }).then((r) => r.data);
}

export function submitAssignment(submissionId: number, submissionText?: string) {
  return api<{ data: { status: string } }>(`/student/assignments/${submissionId}/submit`, {
    method: 'POST',
    body: { submissionText },
  }).then((r) => r.data);
}

export interface ResultCourse {
  id: number;
  name: string;
  code: string;
  credits: number;
  ca_score?: number | null;
  exam_score?: number | null;
  grade: string;
  score: number;
  remark?: string;
}

export interface ResultsReport {
  summary: { cgpa: number; totalCredits: number; standing: string };
  history: Array<{ term: string; tgpa: number; courses: ResultCourse[] }>;
}

export function getResults(signal?: AbortSignal) {
  return api<{ data: ResultsReport }>('/student/results', { signal }).then((r) => r.data);
}

export interface TimetableEntry {
  id: number;
  time: string;
  course: string;
  type: string;
  location: string;
  instructor: string;
  color: string;
}

export function getTimetable(signal?: AbortSignal) {
  return api<{ data: Record<string, TimetableEntry[]> }>('/student/timetable', { signal }).then((r) => r.data);
}

export interface AttendanceReport {
  overall: { percentage: number; totalClasses: number; present: number; absent: number; late: number };
  byCourse: Array<{ id: number; course: string; code: string; percentage: number; present: number; total: number }>;
  recentLogs: Array<{ id: number; date: string; course: string; status: string }>;
}

export function getAttendance(signal?: AbortSignal) {
  return api<{ data: AttendanceReport }>('/student/attendance', { signal }).then((r) => r.data);
}

export interface FeeBreakdownRow {
  id: number;
  description: string;
  amount: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  paid: number;
  due: number;
}

export interface FeesOverview {
  summary: { totalDue: number; totalPaid: number; dueDate: string | null; term: string | null };
  breakdown: FeeBreakdownRow[];
  paymentHistory: Array<{ id: number; date: string; method: string; amount: number; receipt: string }>;
}

export function getFees(signal?: AbortSignal) {
  return api<{ data: FeesOverview }>('/student/fees', { signal }).then((r) => r.data);
}

export interface OutstandingFee {
  id: number;
  description: string;
  due: number;
  required: boolean;
}

export function listOutstandingFees(signal?: AbortSignal) {
  return api<{ data: OutstandingFee[] }>('/student/fees/outstanding', { signal }).then((r) => r.data);
}

export function payFees(feeItemIds: number[], method = 'Card') {
  return api<{ data: { receipt: string; amount: number } }>('/student/fees/pay', {
    method: 'POST',
    body: { feeItemIds, method },
  }).then((r) => r.data);
}

export interface StudentNotificationDto {
  id: number;
  title: string;
  message: string;
  date: string;
  type: 'Academic' | 'Finance' | 'Campus' | 'Warning';
  isRead: boolean;
}

export function listNotifications(signal?: AbortSignal) {
  return api<{ data: StudentNotificationDto[] }>('/student/notifications', { signal }).then((r) => r.data);
}

export function markNotificationRead(id: number) {
  return api(`/student/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return api('/student/notifications/mark-all-read', { method: 'POST' });
}

export interface StudentProfile {
  name: string;
  id: string;
  email: string;
  phone: string | null;
  address: string | null;
  dob: string | null;
  program: string | null;
  department: string | null;
  enrollmentDate: string;
  advisor: string | null;
  status: string;
  avatarUrl: string | null;
  emergencyContact: { name: string; relation: string; phone: string } | null;
  recoveryEmail: string | null;
  notifications: { email: boolean; sms: boolean };
}

export function getProfile(signal?: AbortSignal) {
  return api<{ data: StudentProfile }>('/student/profile', { signal }).then((r) => r.data);
}

export function updateProfile(payload: Partial<Omit<StudentProfile, 'id' | 'email' | 'program' | 'department' | 'enrollmentDate' | 'advisor' | 'status' | 'avatarUrl' | 'name'>>) {
  return api('/student/profile', { method: 'PUT', body: payload });
}

/* ------------------------------------------------------------------ */
/* Computer-Based Testing (CBT) Portal                                 */
/* ------------------------------------------------------------------ */

export interface CbtExamListItem {
  id: number;
  examCode: string;
  courseCode: string;
  courseName: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  format: string;
  hasSubmitted: boolean;
  status: string;
}

export interface CbtExamListResponse {
  cbt_enabled: boolean;
  message?: string;
  student?: { name: string; email: string; student_id_number: string };
  exams: CbtExamListItem[];
}

export interface CbtQuestion {
  id: number;
  question: string;
  options: Record<string, string>;
}

export interface CbtVerificationResponse {
  verified: boolean;
  message: string;
  exam?: {
    id: number;
    title: string;
    courseCode: string;
    courseName: string;
    durationMinutes: number;
    totalPoints: number;
    questionsCount: number;
  };
  student?: { name: string; student_id_number: string };
  questions?: CbtQuestion[];
}

export interface CbtSubmitResponse {
  message: string;
  result: {
    correctCount: number;
    totalQuestions: number;
    examScore: number;
    examMax: number;
    totalScore: number;
    grade: string;
    remark: string;
  };
}

export function listCbtExams(signal?: AbortSignal) {
  return api<CbtExamListResponse>('/student/cbt/exams', { signal });
}

export function verifyCbtAccess(payload: {
  exam_id: number;
  student_name: string;
  student_id_number: string;
  access_code: string;
}) {
  return api<CbtVerificationResponse>('/student/cbt/verify-access', { method: 'POST', body: payload });
}

export function submitCbtExam(payload: {
  exam_id: number;
  answers: Record<number, string>;
}) {
  return api<CbtSubmitResponse>('/student/cbt/submit', { method: 'POST', body: payload });
}
