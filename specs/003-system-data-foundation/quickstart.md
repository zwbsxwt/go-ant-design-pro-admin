# Quickstart: System Data Foundation

## Prerequisites

- Docker Desktop available with 8G memory budget.
- Existing Higress, frontend, and Kratos ports remain unchanged.

## Start Default Data Dependencies

Run:

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
docker compose -f deploy/docker-compose.local.yml ps
```

Expected outcomes:

- MySQL is reachable on `localhost:3306`.
- Redis is reachable on `localhost:6379`.
- Prometheus and Grafana are not started by this default command.

## Backend Verification

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

Run the data integration test against the local containers:

```powershell
cd server/admin-service
$env:ADMIN_SERVICE_TEST_MYSQL_DSN='root:root@tcp(127.0.0.1:3306)/go_ant_design_pro_admin?parseTime=True&loc=Local'
$env:ADMIN_SERVICE_TEST_REDIS_ADDR='127.0.0.1:6379'
go test ./internal/data
```

Expected outcomes:

- Backend starts with MySQL and Redis configured.
- Seed data can be initialized repeatedly without duplicates.
- Seeded `admin / ant.design` and `user / ant.design` login flow still works.

## Documentation Verification

- Confirm deploy docs list ports, credentials, database name, and memory notes.
- Confirm observability docs remain optional and separate.
