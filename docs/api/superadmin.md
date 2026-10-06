# Group 4: SuperAdmin Module — API Reference

Base URL: `/api/v1/superadmin`

Every route requires a Sanctum bearer token belonging to an **active user with
the `superadmin` role**. The module operates across all tenant boundaries, so
no `school_id` scoping is applied to its queries.

| Failure | Status | Body |
| --- | --- | --- |
| No token | `401` | `{"message": "Unauthenticated."}` |
| Non-superadmin | `403` | `{"message": "This area is restricted to platform SuperAdministrators."}` |
| Inactive superadmin | `403` | `{"message": "This SuperAdmin account is not active."}` |
| Validation failure | `422` | `{"message": "...", "errors": {...}}` |

> The platform is **free for every school**. There are no plans, prices or
> invoices anywhere in this API. Per-tenant ceilings (`storage_quota_gb`,
> `max_students`, `max_teachers`) are capacity guards on shared infrastructure.

---

## Platform overview

### `GET /dashboard`
Headline counters, infrastructure vitals and the live security feed.

```json
{
  "data": {
    "tenants":    { "total": 20, "active": 18, "pending": 1, "suspended": 1, "needs_attention": 2 },
    "population": { "students": 30, "teachers": 20, "administrators": 20, "total": 72 },
    "storage":    { "used_gb": 1381.4, "quota_gb": 8150, "usage_percent": 16.9 },
    "infrastructure": { "daily_active_users": 9400, "avg_response_time_ms": 38, "server_cpu_percent": 32 },
    "recentActivity": [ /* AuditLog */ ],
    "alerts": [ /* SystemAlert */ ]
  }
}
```

### `GET /system-reports`
Platform overview plus `campusSizeDistribution` (large / medium / small by
enrolment) and per-tenant rows carrying attendance and storage.

Query: `limit` (1–200, default 50).

---

## Tenant governance — schools

### `GET /schools`
Paginated registry.

| Param | Values |
| --- | --- |
| `status` | `all`, `active`, `pending_approval`, `suspended`, `inactive` |
| `search` | matches name, code, domain, city, contact email |
| `sort` | `name`, `students`, `storage`, `created` |
| `direction` | `asc`, `desc` |
| `per_page` | 1–100 (default 25) |

### `POST /schools`
Provisions a tenant **and** its principal administrator in one transaction — a
tenant with no way in is not a usable tenant. Returns `201`.

```json
{
  "name": "Riverside Institute of Technology",
  "code": "RIT-SMTS-022",
  "domain": "riverside-tech.edu.ng",
  "city": "Ibadan",
  "principal_admin": "Dr. Ifeoma Balogun",
  "principal_email": "i.balogun@riverside-tech.edu.ng",
  "storage_quota_gb": 250,
  "activate_immediately": false
}
```

`code` must match `^[A-Z]{2,6}-SMTS-\d{3}$` and be unique; `domain` must be a
valid hostname and unique. `activate_immediately: false` leaves the tenant
`pending_approval` until its domain is verified.

### `GET /schools/{school}`
One tenant with its metrics snapshot and administrator roster.

### `PATCH /schools/{school}/quota`
`{ "storage_quota_gb": 2000 }` — rejected with `422` when the new ceiling is
below what the school already stores.

### `POST /schools/{school}/suspend`
Optional `{ "reason": "..." }`. Returns `409` if already suspended.

### `POST /schools/{school}/reinstate`
Returns `409` if the tenant is not suspended.

---

## Tenant governance — administrators

### `GET /administrators`
Filters: `status`, `role`, `school_code`, `mfa_gap_only` (bool), `search`, `per_page`.

### `POST /administrators`
Invites an administrator into one boundary; the account is created `pending`
with MFA off until first sign-in. Returns `201`.

```json
{
  "full_name": "Dr. Chiamaka Nwachukwu",
  "email": "c.nwachukwu@lincoln.edu",
  "phone": "+234 803 555 0142",
  "school_code": "LC-SMTS-001",
  "role": "admin",
  "require_mfa": true
}
```

### `GET /administrators/access-report`
Computed posture: platform MFA coverage, per-tenant coverage sorted weakest
first, and every flagged account with its reasons — `no_mfa`, `suspended`,
`disabled`, `never_signed_in`, `dormant` (no sign-in for 14+ days).

### `POST /administrators/enforce-mfa`
`{ "administrator_ids": [1, 2] }` — requires enrolment at next sign-in.

### `POST /administrators/password-resets`
`{ "administrator_ids": [1, 2] }` — queues single-use reset links.

### `PATCH /administrators/{administrator}/status`
`{ "status": "active" | "suspended" | "inactive" }`.

---

## Cross-tenant identity directory

### `GET /system-users`
Filters: `role`, `status`, `school_code`, `search`, `per_page`. The response
`meta` carries `roleCounts` and the `tenants` option list, so the directory
cards stay in step with the page.

SuperAdmins report `schoolCode: "PLATFORM"` since they sit outside every tenant.

### `GET /system-users/{user}`

### `POST /system-users/{user}/revoke-sessions`
Deletes that account's tokens.

### `POST /system-users/revoke-all-sessions`
Platform-wide revocation. **The caller's current token is preserved** so the
operator is not locked out by the action they just performed.

---

## Security audit trail

Entries are append-only. They are written by `AuditLogger` as a side effect of
the action they describe; nothing in this API updates or deletes one.

### `GET /audit-logs`
Filters: `severity` (`info`/`warning`/`critical`), `event_group` (namespace
prefix, e.g. `auth` matches `auth.login.success`), `school_id`, `since`,
`search`, `per_page` (1–200). `meta.severityCounts` accompanies each page.

### `GET /audit-logs/export`
Streams the filtered trail as UTF-8 CSV (BOM included so Excel reads it
correctly), chunked at 500 rows so large exports do not buffer in memory.

### Event types emitted

| Event | Severity | Written when |
| --- | --- | --- |
| `tenant.provisioned` | info | A school is created |
| `tenant.quota_changed` | info | Storage ceiling changes |
| `tenant.suspended` | warning | A school is suspended |
| `tenant.reinstated` | info | A school returns to service |
| `user.invited` | info | An administrator is invited |
| `user.suspended` / `user.unlocked` | warning / info | Account status changes |
| `user.mfa_enforced` | info | MFA is required on an account |
| `user.password_reset_sent` | info | A reset link is issued |
| `auth.sessions_revoked` | warning | One account is signed out |
| `auth.all_sessions_revoked` | critical | Every session is revoked |
| `platform.settings_updated` | info | Configuration changes |

---

## Platform configuration

### `GET /platform-settings`
Settings grouped by category (`general`, `tenancy`, `limits`, `security`,
`mail`, `storage`, `telemetry`). Values arrive **already coerced** to the
declared `dataType`, so `250` is an integer and `true` is a boolean rather than
strings. Encrypted settings return `null`.

### `PUT /platform-settings`
Applies a batch in one transaction and audits the diff.

```json
{ "settings": [ { "key_name": "default_storage_quota_gb", "value": 500 } ] }
```

An unknown `key_name` is rejected with `422`.
