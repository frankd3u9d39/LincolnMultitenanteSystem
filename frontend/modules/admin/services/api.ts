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
  gradeLevel: string | null;
  studentIdNumber: string | null;
  joinedAt: string;
}

export function listStudents(search: string, signal?: AbortSignal) {
  return api<{ data: RosterStudent[] }>('/admin/students', { signal, query: { search, per_page: 100 } }).then((r) => r.data);
}

export function createStudent(payload: { name: string; email: string; gradeLevel?: string }) {
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

export function createTeacher(payload: { name: string; email: string; phone?: string }) {
  return api<{ data: RosterTeacher }>('/admin/teachers', { method: 'POST', body: payload }).then((r) => r.data);
}

export function updateTeacherStatus(id: number, status: string) {
  return api(`/admin/teachers/${id}`, { method: 'PUT', body: { status } });
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
}

export function listClasses(signal?: AbortSignal) {
  return api<{ data: SchoolClassDto[] }>('/admin/classes', { signal }).then((r) => r.data);
}

export function createClass(payload: { name: string; code: string; room?: string; schedule?: string; teacherId?: number | null }) {
  return api<{ data: { id: number } }>('/admin/classes', { method: 'POST', body: payload }).then((r) => r.data);
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
