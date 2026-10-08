# Group 3: Admin Module Documentation

## 1. Overview & Ownership

- **Assigned Group**: **Group 3**
- **Module Persona**: School Administrator / Principal / Registrar
- **Primary Goal**: Empower school administrators to manage school-level academic operations: student admissions, teacher rosters, course catalogs, subjects, academic sessions, fee structures, examinations, and institutional reporting.

---

## 2. Directory Ownership

Group 3 owns and is strictly responsible for the following codebases:

### Frontend
- **Routing & Pages**: `frontend/app/(admin)/*`
  - `dashboard/`, `students/`, `teachers/`, `classes/`, `departments/`, `courses/`, `subjects/`, `sessions/`, `attendance/`, `examinations/`, `results/`, `fees/`, `announcements/`, `reports/`, `staff/`, `school-settings/`, `settings/`
- **Feature Module**: `frontend/modules/admin/`
  - `components/`: Admin-specific components (e.g. `StudentOnboardingWizard`, `FeeScheduleBuilder`).
  - `hooks/`: Custom React hooks (e.g. `useSchoolDepartments`, `useFeeCategories`).
  - `services/`: API client abstractions for school admin endpoints.
  - `types/`: TypeScript definitions and models for administrative workflows.
  - `utils/`: Data processing and aggregation helpers.
- **Service Facade**: `frontend/services/admin/`

### Backend
- **Controllers**: `backend/app/Http/Controllers/Admin/`
- **Form Requests**: `backend/app/Http/Requests/Admin/`
- **Domain Services**: `backend/app/Services/Admin/`
- **API Routes**: `backend/routes/admin.php` (prefixed with `/api/v1/admin`)
- **Tests**:
  - `backend/tests/Feature/Admin/`
  - `backend/tests/Unit/Admin/`

---

## 3. Interaction with Shared Architecture

- **Tenant Scoping**: All operations executed by school admins are strictly bounded by their tenant (`school_id`). School admins **cannot** view or modify records from any other school.
- **Shared Entities**: Group 3 provisions accounts that Group 1 (Students) and Group 2 (Teachers) use. Hence, the `User` and `Role` models are managed via shared contracts in `backend/app/Models/`.
