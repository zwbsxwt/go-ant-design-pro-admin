# Bootstrap Spike

Date: 2026-07-22

This spike validates that the framework modules can run independently before SDD-driven integration work begins.

## Goals

- Keep each module independently runnable.
- Avoid functional integration during bootstrap.
- Record ports, runtime commands, and resource concerns for later SDD decisions.
- Keep optional observability modules pluggable for larger deployments.

## Verified Modules

### Higress

- Directory: `gateway/`
- Runtime: Docker all-in-one image
- Container: `higress-ai`
- Console: `http://localhost:8001`
- Gateway HTTP: `http://localhost:18080`
- Gateway HTTPS: `https://localhost:18443`
- Note: Host port `8080` was unavailable on Windows, so host `18080` maps to container `8080`.

### Prometheus

- Directory: `prometheus/`
- Runtime: Docker Compose
- Container: `template-v6-prometheus`
- UI: `http://localhost:9091`
- Scrape target: `higress-ai:15020/stats/prometheus`
- Status: target `higress-gateway` verified as `up`.

### Grafana

- Directory: `grafana/`
- Runtime: Docker Compose
- Container: `template-v6-grafana`
- UI: `http://localhost:3003`
- Prometheus datasource UID: `higress-prometheus`
- Imported dashboards:
  - `http://localhost:3003/d/higress-basic/higress-gateway-basic?orgId=1&refresh=10s`
  - `http://localhost:3003/d/agq9g7/higress-dashboard?orgId=1&refresh=10s`
  - `http://localhost:3003/d/axtvlt/higress-ai-gateway-dashboard?orgId=1&refresh=10s`

### Ant Design Pro

- Directory: `web/`
- Mode: Simple mode. The demo dashboard, form, list, profile, account, result,
  register, table-list, and chatbot pages have been removed.
- Runtime: `npm run start:no-mock`
- UI: `http://localhost:8000`
- Local real login:
  - Username: `admin`
  - Password: `ant.design`
- Notes:
  - Frontend OpenAPI generation is scoped to auth endpoints only.
  - Production build emitted 26 assets after switching to simple mode.
  - Previous full-mode development server memory usage was about 1.35 GiB.

### Kratos

- Directory: `server/admin-service/`
- Runtime: Kratos v3 CLI generated service
- HTTP: `http://localhost:18000`
- gRPC: `localhost:19000`
- Build command: `go build -o ./bin/ ./cmd/admin-service`
- Run command: `./bin/admin-service -conf ./configs`
- Verification:
  - `go test ./...` passed.
  - `POST /v1/todos/create` returned a created Todo JSON payload.
  - `POST /api/login/account` and authenticated `GET /api/currentUser` are
    available after `specs/001-min-login-integration`.
  - `specs/006-system-user-management` direct-port smoke on temporary
    `http://localhost:18005` passed for admin login, user list/create,
    disable-login rejection, password reset, role binding, refreshed
    current-user permissions, and normal-user 403.
- Notes:
  - Default template ports `8000` and `9000` were changed to `18000` and `19000` to avoid conflicting with Ant Design Pro.
  - `buf` and `wire` were installed for code generation.
  - The template includes Todo sample code by default.
  - Auth login/current-user is the first project-specific SDD feature.
  - User management extends `GET /api/currentUser` with role code, menu
    permission, and button permission payloads.
  - `protoc` is not installed globally; generation is handled through `buf`.

### MySQL

- Directory: `deploy/`
- Runtime: Docker Compose
- Container: `go-ant-admin-mysql`
- Port: `localhost:3306`
- Database: `go_ant_design_pro_admin`
- Local credentials: `root / root`
- Status: local data dependency for system management features.

### Redis

- Directory: `deploy/`
- Runtime: Docker Compose
- Container: `go-ant-admin-redis`
- Port: `localhost:6379`
- Status: local cache/session dependency for system management features.

## Resource Notes

- Observability stack is useful for local full-stack testing and larger deployments.
- For small 4 GiB servers, Grafana and Prometheus should remain optional and not part of the default runtime.
- Local full-stack template testing assumes Docker Desktop has an 8 GiB memory
  budget when Higress, frontend, backend, MySQL, and Redis are running together.
- Observed memory usage:
  - Grafana: about 483 MiB
  - Prometheus: about 36 MiB
  - Higress all-in-one: about 534 MiB
- Higress all-in-one now sets `HIGRESS_GATEWAY_CONCURRENCY` default to `2`
  through `gateway/docker-compose.yml` because the container's Envoy previously
  exited after an OOM-style kill when the image defaulted to concurrency `16`
  under a Docker memory limit of about 3.8 GiB.

## Next

- Spec Kit initialized in Codex skills mode.
- Project constitution established at `.specify/memory/constitution.md`.
- Login, current user, menu permissions, and gateway routing are implemented in
  `specs/001-min-login-integration`.
- Next full SDD feature should build a real module on top of the simple frontend
  shell rather than restoring Ant Design Pro demo pages.
