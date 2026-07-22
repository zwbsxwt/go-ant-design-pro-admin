# Quickstart: System User Management

## Prerequisites

- Features 003, 004, and 005 are implemented.
- Backend, frontend, MySQL, Redis, and Higress can run locally.

## Backend Verification

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Smoke test `/api/system/users`:

- Admin can list seeded users.
- Admin can create and update a user.
- Admin can disable a user; disabled user cannot sign in.
- Admin can reset password and bind roles.
- `/api/currentUser` returns role, menu, and button permission codes.
- Normal user receives authorization failure for management APIs.

## Frontend Verification

```powershell
cd web
npm run lint
npm run test
npm run build
npm start
```

Expected outcomes:

- Admin sees System Management / User Management.
- User table supports CRUD, enable/disable, reset password, and role binding.
- Admin and normal user show different menus and buttons after login.

## Integrated Verification

- Direct ports: `http://localhost:8000` with backend `http://localhost:18000`.
- Gateway entry: `http://localhost:18080`.
- Higress continues routing `/api/*`; it does not enforce JWT or RBAC in this
  feature.
