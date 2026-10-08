# GROUP 3: Admin Module

## Ownership
- **Assigned Group**: GROUP 3
- **Scope**: Dedicated feature logic, components, hooks, services, types, and utils for Admin users.

## Directory Structure
```text
frontend/modules/admin/
├── components/   # Admin-specific UI widgets
├── hooks/        # Admin-specific custom React hooks
├── services/     # Admin-specific API integration services
├── types/        # Admin domain TypeScript models/interfaces
├── utils/        # Admin domain calculations & formatters
└── README.md
```

## Rules
1. Group GROUP 3 works primarily inside this directory.
2. Do NOT import directly into other module folders.
3. Consume shared UI elements from `frontend/components/`.
4. Route compositions are located under `frontend/app/(admin)/`.
