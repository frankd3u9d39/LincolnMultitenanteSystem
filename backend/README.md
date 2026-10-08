# LincolnMultitenanteSystem - Backend API (Laravel)

## 1. Overview

This directory contains the central Laravel REST API powering **LincolnMultitenanteSystem**. The backend serves all four client portals (Student, Teacher, Admin, SuperAdmin) under a unified multi-tenant architecture where **School = Tenant** (`school_id`).

---

## 2. Group Ownership Matrix

To prevent code contention and merge conflicts among the four development groups, backend ownership is strictly partitioned:

| Layer | Group 1 (Student) | Group 2 (Teacher) | Group 3 (Admin) | Group 4 (SuperAdmin) | Shared Core |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Controllers** | `app/Http/Controllers/Student/` | `app/Http/Controllers/Teacher/` | `app/Http/Controllers/Admin/` | `app/Http/Controllers/SuperAdmin/` | `app/Http/Controllers/Auth/` |
| **Requests** | `app/Http/Requests/Student/` | `app/Http/Requests/Teacher/` | `app/Http/Requests/Admin/` | `app/Http/Requests/SuperAdmin/` | - |
| **Services** | `app/Services/Student/` | `app/Services/Teacher/` | `app/Services/Admin/` | `app/Services/SuperAdmin/` | - |
| **Routes** | `routes/student.php` | `routes/teacher.php` | `routes/admin.php` | `routes/superadmin.php` | `routes/api.php`, `routes/auth.php` |
| **Feature Tests**| `tests/Feature/Student/` | `tests/Feature/Teacher/` | `tests/Feature/Admin/` | `tests/Feature/SuperAdmin/` | - |
| **Unit Tests** | `tests/Unit/Student/` | `tests/Unit/Teacher/` | `tests/Unit/Admin/` | `tests/Unit/SuperAdmin/` | - |

---

## 3. Shared Backend Architecture (Strict Governance)

The following directories represent **shared project infrastructure**:

- `app/Models/`: Centralized Eloquent entities (`User`, `School`, etc.).
- `app/Http/Middleware/`: Pipeline for authentication, tenant context injection, and role authorization.
- `app/Policies/`: Shared authorization policies.
- `app/Providers/`: Application service bootstrap providers.
- `database/migrations/`: Database schema definitions.

> [!WARNING]
> No single group may unilaterally edit shared models, shared middleware, or database migrations without cross-team consensus.

---

## 4. Multi-Tenancy Architecture

- **Boundary**: `School = Tenant`.
- **Tenant Key**: All school-level records MUST reference and index `school_id`.
- **Isolation**: Group 1, 2, and 3 queries must always be filtered by `school_id`. Group 4 (SuperAdmin) operates globally across all schools.

---

## 5. Development Commands

```bash
# Install PHP dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Inspect registered routes
php artisan route:list

# Run tests
php artisan test
```
