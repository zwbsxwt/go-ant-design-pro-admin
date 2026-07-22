# Quickstart: System Menu Management

## Prerequisites

- Feature `003-system-data-foundation` is implemented and seed data exists.
- Backend, frontend, MySQL, and Redis can start locally.

## Backend Verification

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Smoke test `/api/system/menus`:

- Admin can list, create, update, disable, and delete an unbound node.
- Normal user receives authorization failure.
- Duplicate permission code is rejected.

## Frontend Verification

```powershell
cd web
npm run lint
npm run test
npm run build
npm start
```

Expected outcomes:

- Admin sees System Management / Menu Management.
- Menu tree shows directory, page, and button nodes.
- Create/edit forms validate required fields.
- Normal user cannot manage menus.

For direct local integration, the development proxy targets
`http://localhost:18000` by default. To test against a temporary backend port,
set `ADMIN_API_TARGET`, for example:

```powershell
cd web
npm exec -- cross-env PORT=8003 MOCK=none ADMIN_API_TARGET=http://localhost:18003 max dev
```
