# LincolnMultitenanteSystem - Frontend Application (Next.js)

## 1. Overview

This directory houses the unified Next.js frontend application for **LincolnMultitenanteSystem**, built with **TypeScript** and the **App Router**. It serves all user roles across schools within a multi-tenant framework where **School = Tenant**.

---

## 2. Four Development Groups & Directory Assignments

To ensure smooth collaboration without merge contention, development is partitioned into four independent groups:

| Group | Module | Route Directory | Feature Module Directory |
| :--- | :--- | :--- | :--- |
| **Group 1** | **Student** | `app/(student)/*` | `modules/student/` |
| **Group 2** | **Teacher** | `app/(teacher)/*` | `modules/teacher/` |
| **Group 3** | **Admin** | `app/(admin)/*` | `modules/admin/` |
| **Group 4** | **SuperAdmin** | `app/(superadmin)/*` | `modules/superadmin/` |

---

## 3. Directory Structure

```text
frontend/
├── app/                                # Next.js App Router root
│   ├── (auth)/                         # Shared Authentication routes
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (student)/                      # Group 1 Student route pages
│   │   ├── dashboard/, profile/, courses/, assignments/, results/,
│   │   └── timetable/, attendance/, fees/, notifications/, settings/
│   ├── (teacher)/                      # Group 2 Teacher route pages
│   │   ├── dashboard/, profile/, classes/, students/, attendance/,
│   │   └── assignments/, grading/, timetable/, materials/, announcements/, settings/
│   ├── (admin)/                        # Group 3 School Admin route pages
│   │   ├── dashboard/, students/, teachers/, classes/, departments/,
│   │   ├── courses/, subjects/, sessions/, attendance/, examinations/,
│   │   └── results/, fees/, announcements/, reports/, staff/, school-settings/, settings/
│   └── (superadmin)/                   # Group 4 Platform SuperAdmin route pages
│       ├── dashboard/, schools/, administrators/, system-users/,
│       └── platform-settings/, audit-logs/, system-reports/, settings/
│
├── components/                         # Shared UI Components (Cross-group)
│   ├── ui/                             # Buttons, cards, inputs, badges
│   ├── layouts/                        # Shell headers, sidebars, content wrappers
│   ├── navigation/                     # Navbars, tab bars, breadcrumbs
│   ├── tables/                         # Paginated data table primitives
│   ├── forms/                          # Input groups, field labels, validators
│   ├── modals/                         # Modal dialogue frames
│   └── charts/                         # Shared chart widgets
│
├── modules/                            # Isolated Group Workspaces
│   ├── student/                        # Group 1: Student components, hooks, types, utils
│   ├── teacher/                        # Group 2: Teacher components, hooks, types, utils
│   ├── admin/                          # Group 3: Admin components, hooks, types, utils
│   └── superadmin/                     # Group 4: SuperAdmin components, hooks, types, utils
│
├── services/                           # API Facades & HTTP Clients
│   ├── api/                            # Axios / fetch base configuration
│   ├── auth/                           # Shared authentication API calls
│   ├── student/                        # Student service client
│   ├── teacher/                        # Teacher service client
│   ├── admin/                          # Admin service client
│   └── superadmin/                     # SuperAdmin service client
│
├── hooks/                              # Shared cross-cutting React hooks
├── types/                              # Shared TypeScript types & interfaces
├── lib/                                # Shared utilities
│   ├── auth/                           # Auth session & token management
│   ├── permissions/                    # Role-based access control (RBAC) helpers
│   ├── school/                         # Multi-tenant context (school_id)
│   ├── validation/                     # Shared validation schemas
│   └── utils/                          # Formatting & common helpers
│
├── constants/                          # Global enums, navigation items, constants
├── middleware.ts                       # Next.js request edge middleware
├── package.json
└── README.md
```

---

## 4. Architectural Rules for Development Groups

1. **Modules vs. App**:
   - The `app/` directory handles **routing and page composition only**.
   - Feature components, hooks, custom types, and domain utilities MUST live inside `modules/<group>/`.
2. **Shared Code Placement**:
   - Generic UI components (buttons, dialogs, inputs, tables) MUST be placed in `components/`.
   - Never create duplicate local versions of buttons or input fields inside your module folder.
3. **Cross-Module Independence**:
   - Group 1 code must never import directly from `modules/teacher/`, `modules/admin/`, or `modules/superadmin/`.
   - Any functionality required by multiple groups must be promoted to `components/` or `lib/`.
4. **Multi-Tenancy**:
   - All tenant identification uses `school_id` provided via the shared session (`lib/school/`).

---

## 5. Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production validation
npm run build
```
The application will run at [http://localhost:3000](http://localhost:3000).
