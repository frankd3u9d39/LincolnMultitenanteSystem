# LincolnMultitenanteSystem - System Architecture

## 1. Overview

**LincolnMultitenanteSystem** is a scalable, enterprise-grade multi-tenant School Management System designed to serve multiple schools (tenants) from a single unified codebase and infrastructure.

The platform is partitioned into:
- **One Next.js Application (`frontend/`)**: Modern TypeScript frontend utilizing the Next.js App Router for server and client rendering.
- **One Laravel API Application (`backend/`)**: Robust PHP REST API providing secure endpoints, business logic segregation, and database interactions.
- **MySQL Database**: Centralized relational data store adhering to tenant isolation rules.

---

## 2. Multi-Tenancy Model: School = Tenant

In this system, each **School** represents an independent **Tenant**.
There is **NO separate Tenant concept** in the user interface or business domain; the School entity *is* the tenant boundary.

```text
Platform (LincolnMultitenanteSystem)
├── School 1 (Tenant 1)
│   ├── School Admin
│   ├── Teachers
│   └── Students
├── School 2 (Tenant 2)
│   ├── School Admin
│   ├── Teachers
│   └── Students
└── SuperAdmin (Platform Operator / Multi-School Governance)
```

### Tenancy Principles
1. **Tenant Identification**: Every school-specific data record must be scoped by `school_id`.
2. **Data Isolation**: A user belonging to School A cannot read, write, or query data belonging to School B.
3. **SuperAdmin Scope**: SuperAdmins operate globally across all schools to manage platform health, onboard schools, audit logs, and oversee billing/licensing.
4. **No Premature Logic**: Tenancy scoping mechanisms (global scopes, multi-tenant middleware) will be introduced in subsequent phases following agreed database architectural reviews.

---

## 3. Separation of Concerns

```text
+-------------------------------------------------------------------------+
|                           CLIENT / BROWSERS                             |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  NEXT.JS FRONTEND (App Router + SSR/CSR)                |
|  - Route Groups: (auth), (student), (teacher), (admin), (superadmin)    |
|  - Group Modules: modules/student, modules/teacher, etc.               |
|  - Shared Components: UI primitives, Layouts, Modals, Forms             |
|  - Shared Libs: Auth tokens, Permissions, School context, Validation    |
+-------------------------------------------------------------------------+
                                    |
                             HTTPS / JSON REST
                                    v
+-------------------------------------------------------------------------+
|                        LARAVEL REST API BACKEND                         |
|  - Routing: routes/api.php -> auth.php, student.php, teacher.php, etc.  |
|  - Controllers: App\Http\Controllers\{Student, Teacher, Admin, ...}     |
|  - Form Requests: App\Http\Requests\{Student, Teacher, Admin, ...}      |
|  - Services: App\Services\{Student, Teacher, Admin, SuperAdmin}         |
|  - Shared Core: Models, Middleware, Policies, Providers                |
+-------------------------------------------------------------------------+
                                    |
                                SQL Queries
                                    v
+-------------------------------------------------------------------------+
|                           MYSQL DATABASE                                |
|  - Tenant-scoped tables with `school_id` foreign keys                   |
|  - Shared migrations & strict cross-group schema consensus              |
+-------------------------------------------------------------------------+
```

---

## 4. Four Development Groups & Module Boundaries

Development is strictly divided among four independent groups:

| Group | Module | Scope | Primary Working Directory |
| :--- | :--- | :--- | :--- |
| **Group 1** | **Student** | Student experience, course enrollment, assignments, grades, timetable, fee viewing | `frontend/modules/student/`<br>`backend/app/.../Student/` |
| **Group 2** | **Teacher** | Class management, grade entry, attendance taking, learning materials, announcements | `frontend/modules/teacher/`<br>`backend/app/.../Teacher/` |
| **Group 3** | **Admin** | School operations, teacher/student rosters, department configs, fee schedules, terms | `frontend/modules/admin/`<br>`backend/app/.../Admin/` |
| **Group 4** | **SuperAdmin** | Multi-school provisioning, platform analytics, audit logging, system user governance | `frontend/modules/superadmin/`<br>`backend/app/.../SuperAdmin/` |

---

## 5. Architectural Non-Negotiables

1. **No Cross-Module Sprawl**: Group 1 cannot edit files in `frontend/modules/teacher/` or `backend/app/Http/Controllers/Teacher/`.
2. **Shared Code Stewardship**: Modifications to shared directories (`components/`, `lib/`, `app/Models/`, `app/Http/Middleware/`) require discussion and pull-request consensus across all teams.
3. **Single Identity System**: Authentication and authorization are shared architectural assets; individual groups must not create distinct login tables or separate JWT/session engines.
