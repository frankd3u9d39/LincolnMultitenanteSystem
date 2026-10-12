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

export interface TeacherClass {
  id: number;
  name: string;
  code: string;
  room: string | null;
  schedule: string | null;
  teacher_id: number;
  students_count?: number;
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

export function takeAttendance(payload: { school_class_id: number; date: string; records: Array<{ student_id: number; status: AttendanceStatus }> }) {
  return api<Envelope<null>>('/teacher/attendance', { method: 'POST', body: payload });
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
