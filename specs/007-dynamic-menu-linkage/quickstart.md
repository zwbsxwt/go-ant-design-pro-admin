# Quickstart: Dynamic Menu Linkage

## Direct Port Verification

Start MySQL and Redis:

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

Start backend:

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

Start frontend:

```powershell
cd web
npm run start:no-mock
```

Open:

```text
http://localhost:8000/user/login
```

Expected:

- `admin / ant.design` sees Chinese left menus including `系统管理`.
- `user / ant.design` does not see system management menus.
- `GET /api/currentUser` includes `menus` with directory/page entries.
- `button_permissions` still contains button permission codes.

## Gateway Verification

Start Higress:

```powershell
cd gateway
docker compose up -d
```

Open:

```text
http://localhost:18080/user/login
```

Expected:

- Admin can open `/system/menu` and see Chinese menu resources.
- User opening `/system/user` receives 403.

## Checks

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service

cd ../../web
npm run lint
npm run test
npm run build
```
