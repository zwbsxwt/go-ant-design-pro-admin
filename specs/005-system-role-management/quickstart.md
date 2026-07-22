# Quickstart: System Role Management

## Prerequisites

- Feature 003 data foundation is implemented.
- Feature 004 menu management is implemented.

## Backend Verification

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Smoke test `/api/system/roles`:

- Admin can list seeded roles.
- Admin can create, update, disable, and delete a safe role.
- Duplicate role code is rejected.
- Role permission update changes current-user menu/button permissions.
- Normal user receives authorization failure.

Smoke verification used during implementation:

- Add `menu-admin` to `role-user` through
  `PUT /api/system/roles/role-user/permissions`.
- Sign in as `user / ant.design`.
- Confirm `GET /api/currentUser` includes `menu.admin`.
- Restore `role-user` to `menu-dashboard` only.

## Frontend Verification

```powershell
cd web
npm run lint
npm run test
npm run build
npm start
```

Expected outcomes:

- Admin sees System Management / Role Management.
- Role table supports CRUD operations.
- Permission binding uses the menu/button tree.
- Normal user cannot manage roles.
