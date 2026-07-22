# Quickstart: Minimum Login Integration

## Prerequisites

- Docker is available for Higress.
- Node.js satisfies `web/package.json` engines.
- Go toolchain is available for `server/admin-service`.
- Local ports from `specs/000-bootstrap/research.md` are free or intentionally
  remapped.

## Independent Backend Check

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
./bin/admin-service -conf ./configs
```

Expected:

- HTTP listens on `http://localhost:18000`.
- gRPC listens on `localhost:19000`.
- Login with the seeded administrator returns a successful sign-in response.
- Current-user request with the returned token returns the administrator profile.

Seeded credentials:

```text
admin / ant.design
user  / ant.design
```

Direct API smoke check:

```powershell
$body = '{"username":"admin","password":"ant.design","type":"account"}'
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:18000/api/login/account `
  -ContentType 'application/json' `
  -Body $body

Invoke-RestMethod -Method Get `
  -Uri http://localhost:18000/api/currentUser `
  -Headers @{ Authorization = "Bearer $($login.token)" }
```

## Independent Frontend Check

```powershell
cd web
npm run lint
npm run test
npm run build
npm run start:no-mock
```

Expected:

- Frontend dev server listens on `http://localhost:8000`.
- Opening `/user/login` shows the Ant Design Pro login page.
- Invalid credentials show a login failure state.
- Integrated verification uses real backend responses, not frontend mock data.
- The frontend is in Ant Design Pro simple mode; demo dashboard/list/mock API
  pages are intentionally absent.

## Independent Gateway Check

```powershell
cd gateway
docker compose up -d
```

Expected:

- Higress console is available at `http://localhost:8001`.
- Gateway HTTP entry is available at `http://localhost:18080`.

## Integrated Gateway Flow

1. Start Kratos backend.
2. Start Ant Design Pro frontend.
3. Start Higress gateway.
4. Configure or verify gateway routes from `contracts/gateway-routes.md`,
   `gateway/README.md`, and `deploy/auth-gateway.local.md`.
5. Open `http://localhost:18080`.
6. Sign in as the seeded administrator.
7. Confirm the authenticated workspace appears.
8. Confirm administrator-only menu entries are visible.
9. Sign out or clear auth state.
10. Sign in as the seeded non-administrator.
11. Confirm administrator-only menu entries are hidden.
12. Refresh the page and confirm current user still loads through the gateway.

## Expected Seed Users

The local seeded users are:

```text
admin / ant.design
user  / ant.design
```

These credentials are for local template verification only and must not be used
as production secrets.

## Troubleshooting

- If `/api/currentUser` returns unauthorized, confirm the browser stored token
  and the gateway preserves the `Authorization` header.
- If the gateway returns 503, confirm Higress all-in-one uses static service
  sources such as `template-v6-api.static:80` and `template-v6-web.static:80`.
- If the login page loads only on `8000`, confirm the gateway frontend route.
- If API calls work only on `18000`, confirm the gateway `/api/*` route.
- If Ant Design Pro still shows mock users, run `npm run start:no-mock` and
  confirm mock mode is disabled for integrated verification.
