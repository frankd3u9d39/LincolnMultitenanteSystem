# Shared Authentication Controllers

- **Owner**: SHARED (Cross-Group)
- **Scope**: Handles shared authentication (login, logout, password recovery, token refresh).
- **Rules**:
  - Do NOT create separate authentication systems for individual modules.
  - All groups share this authentication controller layer.
  - Modifications require cross-group coordination.
