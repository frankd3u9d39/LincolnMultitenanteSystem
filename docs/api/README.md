# REST API Architecture & Routing Conventions

## 1. Overview

The backend is organized as a RESTful JSON API powered by Laravel. All endpoints adhere to standard HTTP status codes, structured JSON envelopes, and clear versioned routing.

---

## 2. Routing Structure

All API routes are routed through `backend/routes/api.php` and segmented by domain into separate dedicated route files:

```text
/api/v1
  ├── /auth          -> backend/routes/auth.php        (Shared authentication endpoints)
  ├── /student       -> backend/routes/student.php     (Group 1: Student endpoints)
  ├── /teacher       -> backend/routes/teacher.php     (Group 2: Teacher endpoints)
  ├── /admin         -> backend/routes/admin.php       (Group 3: School Admin endpoints)
  └── /superadmin    -> backend/routes/superadmin.php  (Group 4: SuperAdmin endpoints)
```

---

## 3. Standard Response Format

Endpoints should return consistent JSON envelopes:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {
    "timestamp": "2026-09-21T14:30:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed or resource not found.",
  "errors": {
    "field_name": ["Specific validation error message."]
  },
  "meta": {
    "timestamp": "2026-09-21T14:30:00Z"
  }
}
```

---

## 4. Cross-Origin & Frontend Integration

- The Next.js frontend connects via standard Axios or native `fetch` abstractions centralized under `frontend/services/api/`.
- All requests in multi-tenant contexts must transmit the appropriate authentication bearer token, which encodes the verified user and their tenant `school_id`.
