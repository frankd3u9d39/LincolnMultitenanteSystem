# Shared Eloquent Models

- **Owner**: SHARED (All Groups)
- **Scope**: Centralized database entities (e.g. `User`, `School`, `Role`, `Department`, `Course`).
- **Rules**:
  - Models are shared resources.
  - No single group may unilaterally modify table relations or schema attributes without cross-team consensus.
  - Multi-tenant models must reference `school_id`.
