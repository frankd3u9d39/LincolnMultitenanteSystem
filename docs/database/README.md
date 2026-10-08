# Database Conventions & Tenancy Guidelines

## 1. Multi-Tenant Philosophy: School = Tenant

The database adheres to a multi-tenant model where **every School is a Tenant**.

- **Tenant Identifier**: The primary tenant foreign key across all school-owned tables is `school_id`.
- **Foreign Key Rules**: Any table containing data that belongs to a school (students, teachers, classes, attendance, grades, fees, etc.) **must** include an indexed `school_id` column.
- **Global Tables**: Only platform-level tables (e.g. `schools`, `plans`, `audit_logs`, global lookup lists) exist without a `school_id`.

---

## 2. Migration Governance & Shared Rules

Migrations located in `backend/database/migrations/` represent a **SHARED RESOURCE**.

1. **No Unilateral Changes**: No individual group may add, modify, or drop columns in shared tables without explicit agreement from all four groups.
2. **Safe Migrations**: Always use non-destructive migration strategies when modifying existing structures.
3. **Foreign Keys & Indices**: Every `school_id` foreign key must have an index to ensure query performance when filtering by tenant.
4. **Soft Deletes**: Consider tenant data retention regulations; critical academic records should implement soft deletes where appropriate.

---

## 3. Seeders and Testing Data

- Shared seeders reside in `backend/database/seeders/`.
- Development teams should write group-scoped test factories in `backend/database/factories/` to generate mock data strictly isolated by `school_id`.
