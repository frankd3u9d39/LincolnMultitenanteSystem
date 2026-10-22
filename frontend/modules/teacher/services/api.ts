// GROUP 2: Teacher Module - API integration (frontend side).
//
// The backend controllers under app/Http/Controllers/Api/Teacher return a
// `{ status, data }` envelope rather than the `{ data }` envelope the other
// three modules use, so every call here unwraps `.data` explicitly instead
// of sharing the other modules' response shape.

import { api } from '@/services/api';

interface Envelope<T> {
  status: string;
  data: T;
}

export interface DashboardStats {
  total_classes: number;
  total_students: number;
  upcoming_assignments: number;
  overall_attendance: number;
}

export function getDashboard(signal?: AbortSignal) {
  return api<Envelope<DashboardStats>>('/teacher/dashboard', { signal }).then((r) => r.data);
}

export interface TeacherClassSubject {
  id: number;
  code: string;
  name: string;
  department?: string | null;
  teacher?: string;
  is_my_subject?: boolean;
  today_taken?: boolean;
}

export interface TeacherClass {
  id: number;
  name: string;
  code: string;
  room: string | null;
  schedule: string | null;
  teacher_id?: number | null;
  teacher?: string;
  is_form_master?: boolean;
  students_count?: number;
  today_attendance?: {
    taken: boolean;
    total: number;
    present: number;
    absent: number;
    late: number;
  };
  subjects?: TeacherClassSubject[];
}

export function listClasses(signal?: AbortSignal) {
  return api<Envelope<TeacherClass[]>>('/teacher/classes', { signal }).then((r) => r.data);
}

export interface ClassStudent {
  id: number;
  user_id: number;
  student_id_number: string | null;
  grade_level: string | null;
  user: { id: number; name: string; email: string };
  pivot?: Record<string, unknown>;
}

export function listClassStudents(classId: number, signal?: AbortSignal) {
  return api<Envelope<ClassStudent[]>>(`/teacher/classes/${classId}/students`, { signal }).then((r) => r.data);
}

/** Fetches every class's roster and flattens them into one deduplicated student list, since the API is class-scoped. */
export async function listAllStudents(signal?: AbortSignal): Promise<Array<ClassStudent & { classNames: string[] }>> {
  const classes = await listClasses(signal);
  const rosters = await Promise.all(classes.map((c) => listClassStudents(c.id, signal).then((students) => ({ cls: c, students }))));

  const byId = new Map<number, ClassStudent & { classNames: string[] }>();

  for (const { cls, students } of rosters) {
    for (const s of students) {
      const existing = byId.get(s.id);
      if (existing) {
        existing.classNames.push(cls.name);
      } else {
        byId.set(s.id, { ...s, classNames: [cls.name] });
      }
    }
  }

  return Array.from(byId.values());
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export function takeAttendance(payload: {
  school_class_id: number;
  course_id?: number | null;
  date: string;
  records: Array<{ student_id: number; status: AttendanceStatus }>;
}) {
  return api<Envelope<null>>('/teacher/attendance', { method: 'POST', body: payload });
}

export interface TeacherAttendanceClassesData {
  classes: TeacherClass[];
  teacher_subjects: Array<{ id: number; code: string; name: string; department?: string | null }>;
  school_subjects: Array<{ id: number; code: string; name: string; department?: string | null }>;
}

export function listAttendanceClasses(signal?: AbortSignal) {
  return api<Envelope<TeacherAttendanceClassesData>>('/teacher/attendance/classes', { signal }).then((r) => r.data);
}

export interface SavedAttendanceRecord {
  student_id: number;
  status: AttendanceStatus;
  type?: string | null;
  updated_at?: string;
}

export function getClassAttendance(
  classId: number,
  query: { date?: string; course_id?: string | number | null },
  signal?: AbortSignal
) {
  return api<Envelope<SavedAttendanceRecord[]>>(`/teacher/classes/${classId}/attendance`, {
    query: {
      date: query.date,
      course_id: query.course_id !== undefined && query.course_id !== null && query.course_id !== '' ? String(query.course_id) : undefined,
    },
    signal,
  }).then((r) => r.data);
}

export interface TeacherAssignment {
  id: number;
  title: string;
  school_class_id: number;
  due_date: string;
  total_marks: number;
  instructions: string | null;
  school_class?: { id: number; name: string; code: string };
  teacher_submissions_count?: number;
}

export function listAssignments(signal?: AbortSignal) {
  return api<Envelope<TeacherAssignment[]>>('/teacher/assignments', { signal }).then((r) => r.data);
}

export function createAssignment(payload: { title: string; school_class_id: number; due_date: string; total_marks: number; instructions?: string }) {
  return api<Envelope<TeacherAssignment>>('/teacher/assignments', { method: 'POST', body: payload }).then((r) => r.data);
}

export interface TeacherAnnouncement {
  id: number;
  title: string;
  content: string;
  target_audience: string;
  is_important: boolean;
  created_at: string;
}

export function listAnnouncements(signal?: AbortSignal) {
  return api<Envelope<TeacherAnnouncement[]>>('/teacher/announcements', { signal }).then((r) => r.data);
}

export function createAnnouncement(payload: { title: string; content: string; target_audience: string; is_important?: boolean }) {
  return api<Envelope<TeacherAnnouncement>>('/teacher/announcements', { method: 'POST', body: payload }).then((r) => r.data);
}

/* ------------------------------------------------------------------ */
/* Teacher Results, CA & Examination Assessments                      */
/* ------------------------------------------------------------------ */

export interface TeacherResultSubject {
  id: number;
  code: string;
  name: string;
  department?: string | null;
  teacher_name?: string;
  is_my_subject?: boolean;
  can_grade?: boolean;
}

export interface TeacherResultClass {
  id: number;
  name: string;
  code: string;
  room: string | null;
  is_form_master: boolean;
  students_count: number;
  subjects: TeacherResultSubject[];
}

export interface TeacherStudentScore {
  student_id: number;
  student_profile_id?: number | null;
  name: string;
  email: string;
  student_id_number: string;
  grade_level?: string;
  ca_score: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade: string | null;
  remark: string | null;
  updated_at?: string | null;
}

export interface TeacherClassResultsResponse {
  status: string;
  class: {
    id: number;
    name: string;
    code: string;
    room: string | null;
    is_form_master: boolean;
  };
  subjects: TeacherResultSubject[];
  selected_course_id: number | null;
  term: string;
  students: TeacherStudentScore[];
}

export function listTeacherResultClasses(signal?: AbortSignal) {
  return api<Envelope<TeacherResultClass[]>>('/teacher/results/classes', { signal }).then((r) => r.data);
}

export function getTeacherClassResults(classId: number, courseId?: number, term?: string, signal?: AbortSignal) {
  const query: Record<string, string | number> = {};
  if (courseId) query.course_id = courseId;
  if (term) query.term = term;
  return api<TeacherClassResultsResponse>(`/teacher/classes/${classId}/results`, { query, signal });
}

export function saveTeacherClassResults(
  classId: number,
  payload: {
    course_id: number;
    term: string;
    results: Array<{
      student_id: number;
      ca_score: number | null;
      exam_score: number | null;
      remark?: string;
    }>;
  }
) {
  return api<{ status: string; message: string; saved_count: number }>(`/teacher/classes/${classId}/results`, {
    method: 'POST',
    body: payload,
  });
}

export async function uploadTeacherClassResultsCsv(
  classId: number,
  courseId: number,
  term: string,
  file: File,
  uploadType: 'combined' | 'ca' | 'exam' = 'combined'
) {
  const token = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('lincoln.token') || window.localStorage.getItem('lincoln.token') || ''
    : '';
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

  const formData = new FormData();
  formData.append('course_id', String(courseId));
  formData.append('term', term);
  formData.append('file', file);
  formData.append('upload_type', uploadType);

  const res = await fetch(`${baseUrl}/teacher/classes/${classId}/results/upload-csv`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to upload result file.');
  }

  return (await res.json()) as { status: string; message: string; saved_count: number; errors: string[] };
}

export function getTeacherTemplateUrl(
  classId: number,
  courseId: number,
  term: string,
  type: 'combined' | 'ca' | 'exam' = 'combined',
  format: 'pdf' | 'csv' = 'pdf'
) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
  return `${baseUrl}/teacher/classes/${classId}/results/csv-template?course_id=${courseId}&term=${encodeURIComponent(term)}&type=${type}&format=${format}`;
}


