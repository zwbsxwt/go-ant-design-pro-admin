# Quickstart: Personal Center And Password Settings

## Prerequisites

Start local dependencies:

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

Start backend:

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf configs
```

Start frontend without mock:

```powershell
cd web
npm run start:no-mock
```

Optional gateway:

```powershell
cd gateway
docker compose up -d
```

## Direct Verification

Open:

```text
http://localhost:8000/user/login
```

1. Login with `admin / ant.design`.
2. Click the avatar menu and choose `个人中心`.
3. Confirm `/account/profile` displays username, display name, email, phone, roles, and status.
4. Change display name, email, or phone and save.
5. Refresh the page and confirm saved values remain.
6. Change password by entering current password, new password, and confirmation.
7. Confirm the app redirects to login after successful password change.
8. Confirm old password fails and new password succeeds.

## Gateway Verification

Open:

```text
http://localhost:18080/user/login
```

Repeat the direct verification through the gateway entry.

## Backend Checks

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Smoke scenarios:

- `GET /api/profile` without token returns `401`.
- `GET /api/profile` with token returns the current user only.
- `PUT /api/profile` updates display name, email, and phone.
- `PUT /api/profile/password` rejects wrong current password.
- `PUT /api/profile/password` accepts correct current password and revokes current token.

## Frontend Checks

```powershell
cd web
npm run lint
npm run test
npm run build
```

Browser scenarios:

- Avatar dropdown shows `个人中心`.
- Personal center page has profile and password sections.
- Invalid email and mismatched passwords show form validation errors.
- Successful profile update refreshes current user display.
- Successful password change redirects to login.
