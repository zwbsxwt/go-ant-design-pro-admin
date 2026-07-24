# Quickstart: RustFS Avatar Upload And Display

## Prerequisites

- MySQL and Redis are running for the admin service.
- RustFS/S3-compatible storage is reachable from the backend machine.
- The avatar bucket exists and is browser-readable for avatar objects.
- Do not commit real access keys or secret keys.

## Local Environment Example

Copy the example file and fill local-only secrets:

```powershell
cd server/admin-service
Copy-Item configs/.env.example configs/.env.local
notepad configs/.env.local
```

`configs/.env.local` is ignored by Git and is loaded automatically when the backend starts.

PowerShell one-off example:

```powershell
$env:ADMIN_S3_ENDPOINT = "http://10.10.117.251:9000"
$env:ADMIN_S3_REGION = "us-east-1"
$env:ADMIN_S3_ACCESS_KEY = "<local access key>"
$env:ADMIN_S3_SECRET_KEY = "<local secret key>"
$env:ADMIN_S3_BUCKET = "go-ant-design-pro-admin"
$env:ADMIN_S3_FORCE_PATH_STYLE = "true"
$env:ADMIN_S3_PUBLIC_BASE_URL = "http://10.10.117.251:9000/go-ant-design-pro-admin"
```

## Start Services

Backend:

```powershell
cd server/admin-service
go run ./cmd/admin-service
```

Frontend:

```powershell
cd web
npm start
```

Optional gateway path:

```text
http://localhost:18080
```

Direct development path:

```text
Frontend: http://localhost:8000
Backend:  http://localhost:18000
```

## Validation

Backend:

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Frontend:

```powershell
cd web
npm run lint
npm run test
npm run build
```

Manual checks:

1. Login as `admin / ant.design`.
2. Open personal center.
3. Upload a valid PNG, JPEG, or WebP under 2 MB.
4. Confirm personal center shows the new avatar.
5. Refresh the page and confirm the right-top avatar still shows the new avatar.
6. Upload a `.txt` file and confirm it is rejected.
7. Upload an image larger than 2 MB and confirm it is rejected.
8. Stop or misconfigure object storage and confirm the upload failure does not break profile display.
9. Repeat through `http://localhost:18080` to verify Higress forwarding.

## Expected Outcomes

- `POST /api/profile/avatar` stores an object in RustFS and updates the signed-in user's avatar.
- `GET /api/profile` returns the latest avatar URL.
- `GET /api/currentUser` returns the latest avatar URL.
- Existing profile edit and password change flows still work.
- No real object storage secret appears in Git-tracked files.
