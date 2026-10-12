# Group 4: SuperAdmin Module — API Reference

Base URL: `/api/v1/superadmin`

Every route requires a Sanctum bearer token belonging to an **active user with
the `superadmin` role**. The module operates across all tenant boundaries, so
no `school_id` scoping is applied to its queries.

## Authentication

Sign-in is bearer-token based (Laravel Sanctum). All shared auth routes live under `/api/v1/auth`.

| Route | Purpose |
| --- | --- |
| `POST /auth/login` | `{ email, password, code? }` → `{ token, user, mfaSetupRequired }` |
| `GET /auth/me` | The signed-in user |
| `POST /auth/logout` | Ends the current session |
| `POST /auth/forgot-password` | Always answers the same way, so addresses cannot be enumerated |
| `POST /auth/reset-password` | Resets the password and signs every device out |

Behaviour worth knowing:

- **Lockout.** Failed attempts are counted per account. Reaching `max_failed_logins` locks it for
  `lockout_duration_minutes` (both from Platform Settings) and returns `429`.
- **Second factor.** An account with an authenticator gets `422 { mfa_required: true }` until it
  sends a valid TOTP `code`, or an unused recovery code, which is consumed on use.
- **Refusals.** Inactive accounts and users of a suspended school get `403`.
- **Maintenance mode** returns `503` to everyone except SuperAdmins and listed bypass addresses.
- **Rate limiting.** Sign-in is throttled per client.

Development accounts (after `php artisan migrate:fresh --seed`): `admin@lincolnplatform.io` and
`m.dauda@lincolnplatform.io`, both with the password `password`.

### Enforced platform settings

These Platform Settings change behaviour, not just stored values:

| Setting | Effect |
| --- | --- |
| `maintenance_mode`, `allowed_bypass_ips` | Blocks all non-SuperAdmin API access and sign-in with the maintenance message |
| `ip_whitelist_enabled`, `allowed_superadmin_ips` | Limits SuperAdmin access to listed addresses. Enabling it without your own address on the list is refused and rolled back |
| `session_timeout_minutes` | Ends sessions inactive for that long. API keys are exempt |
| `max_failed_logins`, `lockout_duration_minutes` | Sign-in lockout |
| `min_password_length`, `require_numbers`, `require_special_chars` | Password change and reset policy |
| `enforce_admin_mfa` | Sign-in reports `mfaSetupRequired` for school administrators without an authenticator |

---

## Errors

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
Platform overview, `campusSizeDistribution`, per-tenant rows, `telemetry` and `isolation`.

Query: `range` (`7d`, `30d`, `quarter`, `ytd`), `limit` (1–200).

- **telemetry** is bucketed so a chart stays legible (daily up to 30 days, weekly for a quarter, monthly
  for the year) and carries the preceding period of equal length for the "vs previous period" figures.
- **compliance_score** per tenant starts at 100 and loses 20 for suspension, 15 for administrators
  without MFA, 10 for storage over 85%, and 10 for no activity in 14 days.
- **isolation** is a real data-integrity check: five queries that count records which have escaped
  their tenant. It proves no row has leaked; it cannot prove a query is scoped.

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

### `POST /schools/{school}/support-access`
`{ "reason": "..." }` (required). Records a 30-minute support access entry in the audit trail at
`warning` severity. The SuperAdmin API already reads across tenants, so this grants no extra capability,
and it does not notify the school.

---

## Tenant governance — administrators

### `GET /administrators`
Filters: `status`, `role`, `school_code`, `mfa_gap_only` (bool), `search`, `per_page`.

### `POST /administrators`
Invites an administrator into one boundary; the account is created `pending`
with MFA off until first sign-in. `role` is one of `principal_admin`, `deputy_admin`,
`bursar`, `registrar`. Returns `201`.

```json
{
  "full_name": "Dr. Chiamaka Nwachukwu",
  "email": "c.nwachukwu@lincoln.edu",
  "phone": "+234 803 555 0142",
  "school_code": "LC-SMTS-001",
  "role": "deputy_admin",
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
`{ "status": "active" | "suspended" | "inactive" }`. Restoring to `active` also clears any temporary
sign-in lockout. The response reports the directory vocabulary: `active`, `invited`, `locked`, `disabled`.

### `GET|PUT /administrators/{administrator}/permissions`
The capability catalogue (owned by the server), what this person currently holds, and the defaults for
their title. `PUT { "granted": ["fees.configure", ...] }` replaces the list. A principal administrator
cannot lose `admins.invite`; unknown capabilities are rejected; each change is audited as a diff.

> `POST /administrators/enforce-mfa` sets `mfa_required`, which is different from being enrolled, so
> enforcing MFA never inflates the coverage figure.

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
| `platform.settings_updated` | info | Configuration changes (recorded as a from/to diff) |
| `tenant.support_access` | warning | Support access to a tenant is logged, with its reason |
| `user.permissions_changed` | info / warning | An administrator's capabilities change (warning when any are revoked) |
| `user.profile_updated`, `user.password_changed`, `user.mfa_enrolled`, `user.recovery_codes_regenerated` | info / warning | The operator changes their own account |
| `auth.login.success`, `auth.logout` | info | Sign-in and sign-out |
| `auth.login.failed`, `auth.login.blocked` | warning | A failed or refused sign-in |
| `auth.login.locked` | critical | An account is locked after repeated failures |
| `platform.api_key_created`, `platform.api_key_revoked` | info / warning | Integration keys (warning for admin scope and revocation) |
| `platform.mail_test_sent`, `platform.mail_test_failed` | info / warning | The test email button |
| `platform.backup_completed`, `platform.backup_failed` | info / warning | The backup button |

---

## Operator account

Everything under `/account` acts on the signed-in SuperAdmin only.

| Route | Purpose |
| --- | --- |
| `GET/PUT /account` | Profile, localisation, alert preferences |
| `PUT /account/password` | Enforces the platform password policy; signs out other devices |
| `GET /account/sessions`, `DELETE /account/sessions/others` | Signed-in devices with browser, OS and IP |
| `GET/POST /account/api-keys`, `DELETE /account/api-keys/{id}` | Integration keys |
| `POST /account/mfa/setup`, `POST /account/mfa/confirm` | Authenticator enrolment |
| `POST /account/recovery-codes` | Issues 8 fresh single-use codes |

- **API keys** are shown once and stored as a SHA-256 hash. A `read_only` key can only `GET`, a
  `read_write` key can write, and `admin` can do everything. Revoking expires the token but keeps the row.
- **MFA enrolment** is RFC 6238 TOTP. `/mfa/setup` returns a fresh secret but changes nothing; the existing
  authenticator keeps working until `/mfa/confirm` receives a valid code, so abandoning a re-enrolment
  cannot lock anyone out. Recovery codes are stored hashed.

---

## Platform configuration

### `GET /platform-settings`
Settings grouped by category (`general`, `tenancy`, `limits`, `security`,
`mail`, `storage`, `telemetry`). Values arrive **already coerced** to the
declared `dataType`, so `250` is an integer and `true` is a boolean rather than
strings. Encrypted settings (the SMTP password) return `null` plus an `isSet` flag, and a blank value on
save leaves the stored secret untouched.

### `POST /platform-settings/test-email`
Sends a real message to the caller through the configured SMTP relay. Failure is reported honestly,
with the relay's own error.

### `POST /platform-settings/backup`
Copies the SQLite database into `storage/app/backups` and records the outcome. On other database engines it
says that no dump job is configured instead of reporting a backup that never happened.

### `PUT /platform-settings`
Applies a batch in one transaction and audits the diff.

```json
{ "settings": [ { "key_name": "default_storage_quota_gb", "value": 500 } ] }
```

An unknown `key_name` is rejected with `422`.
