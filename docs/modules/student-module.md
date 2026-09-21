# Group 1: Student Module Documentation

## 1. Overview & Ownership

- **Assigned Group**: **Group 1**
- **Module Persona**: Enrolled Student
- **Primary Goal**: Provide a streamlined, accessible student portal for managing academic schedules, tracking grades, reviewing course materials, checking attendance, and monitoring fee balances.

---

## 2. Directory Ownership

Group 1 owns and is strictly responsible for the following codebases:

### Frontend
- **Routing & Pages**: `frontend/app/(student)/*`
  - `dashboard/`, `profile/`, `courses/`, `assignments/`, `results/`, `timetable/`, `attendance/`, `fees/`, `notifications/`, `settings/`
- **Feature Module**: `frontend/modules/student/`
  - `components/`: Student-specific widgets (e.g. `AssignmentSubmissionCard`, `GradeOverviewCard`).
  - `hooks/`: Custom React hooks (e.g. `useStudentCourses`, `useTimetable`).
  - `services/`: API client abstractions for student endpoints.
  - `types/`: TypeScript definitions and models for student workflows.
  - `utils/`: Calculation and formatting helpers.
- **Service Facade**: `frontend/services/student/`

### Backend
- **Controllers**: `backend/app/Http/Controllers/Student/`
- **Form Requests**: `backend/app/Http/Requests/Student/`
- **Domain Services**: `backend/app/Services/Student/`
- **API Routes**: `backend/routes/student.php` (prefixed with `/api/v1/student`)
- **Tests**:
  - `backend/tests/Feature/Student/`
  - `backend/tests/Unit/Student/`

---

## 3. Interaction with Shared Architecture

- **Tenant Scoping**: All student queries will automatically filter by `school_id` derived from the authenticated student's session.
- **Shared Components**: Generic UI components (e.g. buttons, modals, basic tables) must be consumed from `frontend/components/` rather than re-implemented inside `modules/student/`.
- **Shared Models**: Core models such as `User`, `Course`, `Enrollment`, and `School` reside in `backend/app/Models/` and are shared across groups. Changes to shared models require coordination with other groups.
