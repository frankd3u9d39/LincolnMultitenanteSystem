# LincolnMultitenanteSystem - Folder Structure Specification

This document defines the complete directory organization for **LincolnMultitenanteSystem**. All development groups must adhere strictly to these directory boundaries.

---

## 1. High-Level Repository Structure

```text
LincolnMultitenanteSystem/
├── frontend/             # Single Next.js Application (TypeScript + App Router)
├── backend/              # Single Laravel API Application (PHP 8.2+)
├── docs/                 # Architectural specifications & onboarding docs
└── README.md             # Master project guide, team roles, & workflow rules
```

---

## 2. Frontend Directory Tree (`frontend/`)

```text
frontend/
├── app/                                # Next.js App Router root
│   ├── (auth)/                         # Public / shared authentication routes
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (student)/                      # Group 1 Student route pages
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── courses/
│   │   ├── assignments/
│   │   ├── results/
│   │   ├── timetable/
│   │   ├── attendance/
│   │   ├── fees/
│   │   ├── notifications/
│   │   └── settings/
│   ├── (teacher)/                      # Group 2 Teacher route pages
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── classes/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── assignments/
│   │   ├── grading/
│   │   ├── timetable/
│   │   ├── materials/
│   │   ├── announcements/
│   │   └── settings/
│   ├── (admin)/                        # Group 3 School Admin route pages
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── departments/
│   │   ├── courses/
│   │   ├── subjects/
│   │   ├── sessions/
│   │   ├── attendance/
│   │   ├── examinations/
│   │   ├── results/
│   │   ├── fees/
│   │   ├── announcements/
│   │   ├── reports/
│   │   ├── staff/
│   │   ├── school-settings/
│   │   └── settings/
│   └── (superadmin)/                   # Group 4 Platform SuperAdmin route pages
│       ├── dashboard/
│       ├── schools/
│       ├── administrators/
│       ├── system-users/
│       ├── platform-settings/
│       ├── audit-logs/
│       ├── system-reports/
│       └── settings/
│
├── components/                         # Shared frontend UI primitives (Shared)
│   ├── ui/                             # Buttons, inputs, badges, cards, etc.
│   ├── layouts/                        # Reusable shell layouts & wrappers
│   ├── navigation/                     # Navbars, sidebars, breadcrumbs
│   ├── tables/                         # Generic paginated data tables
│   ├── forms/                          # Form helpers, input groups
│   ├── modals/                         # Modal dialogue frames
│   └── charts/                         # Shared chart widgets
│
├── modules/                            # Isolated Group Workspaces
│   ├── student/                        # Group 1: Student feature logic
│   │   ├── components/                 # Student-specific components
│   │   ├── hooks/                      # Student-specific custom hooks
│   │   ├── services/                   # Student-specific API clients
│   │   ├── types/                      # Student domain interfaces
│   │   ├── utils/                      # Student helper utilities
│   │   └── README.md
│   ├── teacher/                        # Group 2: Teacher feature logic
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── README.md
│   ├── admin/                          # Group 3: Admin feature logic
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── README.md
│   └── superadmin/                     # Group 4: SuperAdmin feature logic
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── README.md
│
├── services/                           # Base API client and shared services
│   ├── api/                            # Axios/Fetch base HTTP client & interceptors
│   ├── auth/                           # Shared authentication tokens & session calls
│   ├── student/                        # Student service facade
│   ├── teacher/                        # Teacher service facade
│   ├── admin/                          # Admin service facade
│   └── superadmin/                     # SuperAdmin service facade
│
├── hooks/                              # Shared custom React hooks (e.g. useMediaQuery)
├── types/                              # Shared cross-cutting TypeScript interfaces
├── lib/                                # Shared utilities and core helpers
│   ├── auth/                           # Token decoding, session persistence
│   ├── permissions/                    # RBAC evaluation helpers
│   ├── school/                         # Tenant / School context helpers
│   ├── validation/                     # Shared Zod / schema validators
│   └── utils/                          # Formatting, dates, string utilities
│
├── constants/                          # Global constants, routes, status enums
├── middleware.ts                       # Next.js request edge middleware
├── package.json
└── README.md
```

---

## 3. Backend Directory Tree (`backend/`)

```text
backend/
├── app/
│   ├── Models/                         # Shared Eloquent Models (Shared)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/                   # Shared Authentication Controllers
│   │   │   ├── Student/                # Group 1 Controllers
│   │   │   ├── Teacher/                # Group 2 Controllers
│   │   │   ├── Admin/                  # Group 3 Controllers
│   │   │   └── SuperAdmin/             # Group 4 Controllers
│   │   │
│   │   ├── Requests/
│   │   │   ├── Student/                # Group 1 Form Requests
│   │   │   ├── Teacher/                # Group 2 Form Requests
│   │   │   ├── Admin/                  # Group 3 Form Requests
│   │   │   └── SuperAdmin/             # Group 4 Form Requests
│   │   │
│   │   └── Middleware/                 # Shared Middleware (Auth, Tenant, CORS)
│   │
│   ├── Services/
│   │   ├── Student/                    # Group 1 Business Logic Services
│   │   ├── Teacher/                    # Group 2 Business Logic Services
│   │   ├── Admin/                      # Group 3 Business Logic Services
│   │   └── SuperAdmin/                 # Group 4 Business Logic Services
│   │
│   ├── Policies/                       # Shared Authorization Policies
│   └── Providers/                      # Shared Service Providers
│
├── database/                           # Shared DB migrations, factories, seeders
│   ├── migrations/
│   ├── seeders/
│   └── factories/
│
├── routes/                             # Cleanly decoupled API routes
│   ├── api.php                         # Master API entrypoint aggregating sub-routes
│   ├── auth.php                        # Shared Auth route group
│   ├── student.php                     # Group 1: /api/v1/student/*
│   ├── teacher.php                     # Group 2: /api/v1/teacher/*
│   ├── admin.php                       # Group 3: /api/v1/admin/*
│   └── superadmin.php                  # Group 4: /api/v1/superadmin/*
│
├── tests/
│   ├── Feature/
│   │   ├── Student/                    # Group 1 Feature tests
│   │   ├── Teacher/                    # Group 2 Feature tests
│   │   ├── Admin/                      # Group 3 Feature tests
│   │   └── SuperAdmin/                 # Group 4 Feature tests
│   │
│   └── Unit/
│       ├── Student/                    # Group 1 Unit tests
│       ├── Teacher/                    # Group 2 Unit tests
│       ├── Admin/                      # Group 3 Unit tests
│       └── SuperAdmin/                 # Group 4 Unit tests
│
├── composer.json
└── README.md
```
