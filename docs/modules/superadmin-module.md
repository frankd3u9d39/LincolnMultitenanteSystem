# Group 4: SuperAdmin Module Documentation

## 1. Overview & Ownership

- **Assigned Group**: **Group 4**
- **Module Persona**: Platform SuperAdmin / System Owner
- **Primary Goal**: Manage the entire multi-tenant infrastructure: onboarding new schools (tenants), provisioning school administrator accounts, monitoring system health, reviewing security audit logs, managing global platform configurations, and generating cross-tenant analytics.

---

## 2. Directory Ownership

Group 4 owns and is strictly responsible for the following codebases:

### Frontend
- **Routing & Pages**: `frontend/app/(superadmin)/*`
  - `dashboard/`, `schools/`, `administrators/`, `system-users/`, `platform-settings/`, `audit-logs/`, `system-reports/`, `settings/`
- **Feature Module**: `frontend/modules/superadmin/`
  - `components/`: Platform-level UI (e.g. `SchoolProvisioningModal`, `TenantMetricsCard`).
  - `hooks/`: Custom React hooks (e.g. `useTenantList`, `useAuditLogs`).
  - `services/`: API client abstractions for SuperAdmin endpoints.
  - `types/`: TypeScript definitions and models for platform-wide workflows.
  - `utils/`: System metric calculations and telemetry formatters.
- **Service Facade**: `frontend/services/superadmin/`

### Backend
- **Controllers**: `backend/app/Http/Controllers/SuperAdmin/`
- **Form Requests**: `backend/app/Http/Requests/SuperAdmin/`
- **Domain Services**: `backend/app/Services/SuperAdmin/`
- **API Routes**: `backend/routes/superadmin.php` (prefixed with `/api/v1/superadmin`)
- **Tests**:
  - `backend/tests/Feature/SuperAdmin/`
  - `backend/tests/Unit/SuperAdmin/`

---

## 3. Interaction with Shared Architecture

- **Global Scope**: Unlike Groups 1, 2, and 3, SuperAdmin queries are **not** restricted to a single `school_id`. SuperAdmins have authority across tenant boundaries.
- **Tenant Management**: SuperAdmin registers the `School` record which establishes the tenant boundary for all other groups.
- **Security & Auditing**: Group 4 defines system audit patterns that all other groups consume when recording critical operational logs.
