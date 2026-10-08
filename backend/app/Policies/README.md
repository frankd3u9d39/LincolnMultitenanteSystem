# Shared Authorization Policies

- **Owner**: SHARED (All Groups)
- **Scope**: Laravel Policies defining granular authorization checks (e.g. `CoursePolicy`, `GradePolicy`, `SchoolPolicy`).
- **Rules**:
  - Enforce tenant isolation (`school_id`) and role capability checks.
  - Shared across groups to prevent diverging access control rules.
