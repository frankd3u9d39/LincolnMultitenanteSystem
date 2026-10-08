# GROUP 4: SuperAdmin Module

## Ownership
- **Assigned Group**: GROUP 4
- **Scope**: Dedicated feature logic, components, hooks, services, types, and utils for SuperAdmin users.

## Directory Structure
```text
frontend/modules/superadmin/
├── components/   # SuperAdmin-specific UI widgets
├── hooks/        # SuperAdmin-specific custom React hooks
├── services/     # SuperAdmin-specific API integration services
├── types/        # SuperAdmin domain TypeScript models/interfaces
├── utils/        # SuperAdmin domain calculations & formatters
└── README.md
```

## Rules
1. Group GROUP 4 works primarily inside this directory.
2. Do NOT import directly into other module folders.
3. Consume shared UI elements from `frontend/components/`.
4. Route compositions are located under `frontend/app/(superadmin)/`.
