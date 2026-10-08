# LincolnMultitenanteSystem

A comprehensive, scalable, multi-tenant School Management System designed to serve multiple schools (tenants) across a unified Next.js frontend and Laravel REST API backend.

---

## 1. What the Project Is

**LincolnMultitenanteSystem** provides an end-to-end digital campus solution for multiple independent educational institutions. Each school operates within its own secure tenant boundary, supporting students, teachers, and school administrators, while platform-level SuperAdmins oversee system health, school provisioning, and global compliance.

---

## 2. Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Vanilla CSS design tokens.
- **Backend**: Laravel (PHP 8.2+), REST API architecture.
- **Database**: MySQL (multi-tenant relational data store).
- **Architecture**: Decoupled Single Page / Server Rendered Frontend with a centralized RESTful API.

```text
LincolnMultitenanteSystem/
├── frontend/    # ONE Next.js Application
├── backend/     # ONE Laravel REST API
├── docs/        # Architectural Specifications & Group Guidelines
└── README.md    # Master Project Documentation
```

---

## 3. The Four Development Groups

Development is divided across four independent engineering teams to maximize productivity and eliminate merge conflicts:

| Group | Module | Target Audience | Primary Focus |
| :--- | :--- | :--- | :--- |
| **Group 1** | **Student Module** | Students | Course enrollment, assignments, grades, timetable, attendance, fees |
| **Group 2** | **Teacher Module** | Teachers | Class management, grade book, attendance rosters, materials, notices |
| **Group 3** | **Admin Module** | School Admins | Student & staff admissions, academic calendars, subjects, fee policies |
| **Group 4** | **SuperAdmin Module**| Platform Owners| School/tenant provisioning, billing, audit logs, system telemetry |

---

## 4. Folder Ownership Matrix

### Group-Owned Code (Isolated Areas)

```text
GROUP 1: STUDENT
├── Frontend Routing:  frontend/app/(student)/*
├── Frontend Module:   frontend/modules/student/*
├── Frontend Service:  frontend/services/student/*
├── Backend Controller:backend/app/Http/Controllers/Student/*
├── Backend Requests:  backend/app/Http/Requests/Student/*
├── Backend Service:   backend/app/Services/Student/*
├── Backend Routes:    backend/routes/student.php
└── Backend Tests:     backend/tests/{Feature,Unit}/Student/*

GROUP 2: TEACHER
├── Frontend Routing:  frontend/app/(teacher)/*
├── Frontend Module:   frontend/modules/teacher/*
├── Frontend Service:  frontend/services/teacher/*
├── Backend Controller:backend/app/Http/Controllers/Teacher/*
├── Backend Requests:  backend/app/Http/Requests/Teacher/*
├── Backend Service:   backend/app/Services/Teacher/*
├── Backend Routes:    backend/routes/teacher.php
└── Backend Tests:     backend/tests/{Feature,Unit}/Teacher/*

GROUP 3: ADMIN
├── Frontend Routing:  frontend/app/(admin)/*
├── Frontend Module:   frontend/modules/admin/*
├── Frontend Service:  frontend/services/admin/*
├── Backend Controller:backend/app/Http/Controllers/Admin/*
├── Backend Requests:  backend/app/Http/Requests/Admin/*
├── Backend Service:   backend/app/Services/Admin/*
├── Backend Routes:    backend/routes/admin.php
└── Backend Tests:     backend/tests/{Feature,Unit}/Admin/*

GROUP 4: SUPERADMIN
├── Frontend Routing:  frontend/app/(superadmin)/*
├── Frontend Module:   frontend/modules/superadmin/*
├── Frontend Service:  frontend/services/superadmin/*
├── Backend Controller:backend/app/Http/Controllers/SuperAdmin/*
├── Backend Requests:  backend/app/Http/Requests/SuperAdmin/*
├── Backend Service:   backend/app/Services/SuperAdmin/*
├── Backend Routes:    backend/routes/superadmin.php
└── Backend Tests:     backend/tests/{Feature,Unit}/SuperAdmin/*
```

---

## 5. Shared Code (Cross-Cutting Architecture)

The following areas are **shared project resources** and do not belong to any single group:

### Frontend Shared Code
- `frontend/components/`: Reusable primitives (`ui/`, `layouts/`, `navigation/`, `tables/`, `forms/`, `modals/`, `charts/`).
- `frontend/lib/`: Core helpers (`auth/`, `permissions/`, `school/`, `validation/`, `utils/`).
- `frontend/hooks/`: Cross-cutting React hooks.
- `frontend/types/`: Global TypeScript types and interfaces.
- `frontend/services/api/` & `frontend/services/auth/`: Core HTTP and authentication clients.
- `frontend/constants/`: System-wide enums and configurations.
- `frontend/middleware.ts`: Edge route protection.

### Backend Shared Code
- `backend/app/Models/`: Shared Eloquent database models (e.g. `User`, `School`).
- `backend/app/Http/Middleware/`: Shared request pipeline (auth, tenant resolution, CORS).
- `backend/app/Policies/`: Authorization policy definitions.
- `backend/app/Providers/`: Core framework service providers.
- `backend/database/`: Shared migrations, seeders, and factories.
- `backend/routes/api.php` & `backend/routes/auth.php`: Core API routing and authentication.

---

## 6. How Student, Teacher, Admin, and SuperAdmin Differ

```text
┌───────────────────────────────────────────────────────────────┐
│                      SUPERADMIN MODULE                        │
│ - Global platform authority (not scoped to one school)         │
│ - Provisions schools (tenants) & assigns initial admins       │
│ - Inspects system audit logs and platform metrics             │
└───────────────────────────────┬───────────────────────────────┘
                                │ provisions tenants
                                v
┌───────────────────────────────────────────────────────────────┐
│                 SCHOOL TENANT BOUNDARY (school_id)            │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │                     ADMIN MODULE                      │   │
│   │ - Manages a single school's operations & configuration │   │
│   │ - Registers teachers, students, courses, & fee scales │   │
│   └───────────────────────────┬───────────────────────────┘   │
│                               │                               │
│            ┌──────────────────┴──────────────────┐            │
│            v                                     v            │
│   ┌─────────────────────┐               ┌─────────────────┐   │
│   │   TEACHER MODULE    │               │ STUDENT MODULE  │   │
│   │ - Delivers courses  │               │ - Consumes info │   │
│   │ - Grades & attends  │               │ - Submits work  │   │
│   └─────────────────────┘               └─────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. The School / Tenant Concept

- **School = Tenant**: There is NO distinct "Tenant" term in user-facing flows. A school *is* the tenant.
- **Tenant Scope**: Each school's data is isolated using `school_id`. Users from School A can never see or mutate data from School B.
- **Unified Identity**: Users authenticate through a single authentication mechanism, and their assigned school context governs access.

---

## 8. Group Development Rules

1. **Rule 1 - Stay in Your Assigned Module**: Each group must work primarily inside its assigned module (`modules/<group>` and corresponding `app/(<group>)` routes).
2. **Rule 2 - No Unilateral Cross-Module Edits**: Never modify another group's module without explicit coordination and approval.
3. **Rule 3 - Shared Code Belongs in Shared Folders**: Generic, reusable components, hooks, or utilities must reside in shared folders (`components/`, `lib/`), not hidden inside a specific module.
4. **Rule 4 - Do Not Duplicate Shared Utilities**: If a shared component or utility exists, reuse it. Do not create local copies.
5. **Rule 5 - Database Schema Consensus**: Migrations are shared. You must NOT alter shared tables or columns without consensus across all four groups.
6. **Rule 6 - Unified Authentication**: Do not create isolated login or token systems for each group. Authentication is a single shared system.
7. **Rule 7 - Single Tenancy Boundary**: Do not invent custom multi-tenancy logic per module. All groups rely on the unified `school_id` architecture.
8. **Rule 8 - Strict Git Branching**: All branch names must reflect group ownership:
   - `feature/student-*`
   - `feature/teacher-*`
   - `feature/admin-*`
   - `feature/superadmin-*`

---

## 9. Git Workflow Recommendations

```text
main (Production releases only)
  └── develop (Integration & staging branch)
        ├── feature/student-*     (Group 1 branches)
        ├── feature/teacher-*     (Group 2 branches)
        ├── feature/admin-*       (Group 3 branches)
        └── feature/superadmin-*  (Group 4 branches)
```

- Develop features locally on group-specific feature branches.
- Submit Pull Requests against `develop`.
- Require at least one peer approval within the group and, if modifying shared code, approval from leads of affected groups.

---

## 10. Basic Project Setup Instructions

### Prerequisites
- Node.js (v18.0+) & npm
- PHP (v8.2+) & Composer
- MySQL Server

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure database credentials in .env
php artisan migrate
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the frontend application.
Open [http://localhost:8000/api](http://localhost:8000/api) to access the backend API.
