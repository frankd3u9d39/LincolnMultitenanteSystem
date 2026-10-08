# Group 2: Teacher Module Documentation

## 1. Overview & Ownership

- **Assigned Group**: **Group 2**
- **Module Persona**: Teacher / Academic Instructor
- **Primary Goal**: Provide comprehensive teaching tools for managing assigned classes, recording attendance, creating and grading assignments, sharing learning materials, and communicating with students.

---

## 2. Directory Ownership

Group 2 owns and is strictly responsible for the following codebases:

### Frontend
- **Routing & Pages**: `frontend/app/(teacher)/*`
  - `dashboard/`, `profile/`, `classes/`, `students/`, `attendance/`, `assignments/`, `grading/`, `timetable/`, `materials/`, `announcements/`, `settings/`
- **Feature Module**: `frontend/modules/teacher/`
  - `components/`: Teacher-specific UI (e.g. `GradingMatrix`, `AttendanceRosterSheet`).
  - `hooks/`: Custom React hooks (e.g. `useTeacherClasses`, `useGradeBook`).
  - `services/`: API client abstractions for teacher endpoints.
  - `types/`: TypeScript definitions and models for teacher workflows.
  - `utils/`: Calculation and formatting helpers (e.g. GPA or score weighting).
- **Service Facade**: `frontend/services/teacher/`

### Backend
- **Controllers**: `backend/app/Http/Controllers/Teacher/`
- **Form Requests**: `backend/app/Http/Requests/Teacher/`
- **Domain Services**: `backend/app/Services/Teacher/`
- **API Routes**: `backend/routes/teacher.php` (prefixed with `/api/v1/teacher`)
- **Tests**:
  - `backend/tests/Feature/Teacher/`
  - `backend/tests/Unit/Teacher/`

---

## 3. Interaction with Shared Architecture

- **Tenant Scoping**: All queries are bound to the teacher's `school_id`.
- **Cross-Group Interaction with Students**: While teachers grade students, the underlying data models (`User`, `Assignment`, `Submission`) are shared resources located in `backend/app/Models/`.
- **Shared Code Policy**: Do not introduce ad-hoc styles or duplicate generic components; utilize `frontend/components/ui/` and `frontend/lib/`.
