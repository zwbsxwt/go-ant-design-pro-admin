# go-ant-design-pro-admin

SDD-driven admin framework template with Higress, Kratos, Ant Design Pro,
MySQL, Redis, and optional observability modules.

This repository is a reusable backend-admin template. It keeps the frontend,
backend, gateway, MCP, and observability modules independently runnable, then
uses Spec Kit / SDD artifacts to drive real feature integration.

## What Is Included

- Ant Design Pro simple-mode admin frontend.
- Kratos Go backend service.
- MySQL-backed user, role, menu, and button-permission RBAC.
- Redis-backed local login token storage.
- Higress gateway entry for integrated local verification.
- Optional Prometheus and Grafana modules for larger projects.
- Spec Kit / SDD feature artifacts for the implemented baseline features.

Implemented baseline features:

- Login and current-user integration.
- Admin branding as `go-ant-design-pro-admin`.
- Docker MySQL and Redis local data dependencies.
- System Management / Menu Management.
- System Management / Role Management.
- System Management / User Management.
- Role-menu and role-button permission binding.
- User-role binding.

## Architecture

```text
gateway/          Higress gateway layer
server/           Kratos Go backend services
web/              Ant Design Pro frontend
mcp/              optional future MCP services
prometheus/       optional metrics collection
grafana/          optional dashboards
deploy/           deployment config
docs/             architecture and development guides
specs/            Spec Kit / SDD artifacts
spec-kit-skill/   local Spec Kit operating guide for AI agents
```

Default local ports:

| Module | URL |
| --- | --- |
| Ant Design Pro | `http://localhost:8000` |
| Kratos HTTP | `http://localhost:18000` |
| Kratos gRPC | `localhost:19000` |
| Higress Console | `http://localhost:8001` |
| Higress Gateway HTTP | `http://localhost:18080` |
| Higress Gateway HTTPS | `https://localhost:18443` |
| MySQL | `localhost:3306` |
| Redis | `localhost:6379` |
| Prometheus, optional | `http://localhost:9091` |
| Grafana, optional | `http://localhost:3003` |

## Prerequisites

- Docker Desktop.
- Go matching the Kratos service toolchain.
- Node.js `>=22`.
- npm.
- Git.

Recommended local Docker memory:

- Direct frontend/backend/MySQL/Redis development: 4 GiB is usually enough.
- Full local stack with Higress, frontend, backend, MySQL, and Redis: 8 GiB is
  recommended.
- Prometheus and Grafana are optional and should stay disabled for small
  projects unless needed.

## Quick Start

Start the default lightweight development stack first. This does not require
Prometheus or Grafana.

1. Start MySQL and Redis:

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

2. Start the Kratos backend:

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
./bin/admin-service -conf ./configs
```

On Windows PowerShell, run:

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

3. Start the Ant Design Pro frontend:

```powershell
cd web
npm install
npm run start:no-mock
```

4. Open the frontend:

```text
http://localhost:8000/user/login
```

Seeded local accounts:

| Username | Password | Access |
| --- | --- | --- |
| `admin` | `ant.design` | Full system management |
| `user` | `ant.design` | Basic user access |

After signing in as `admin`, open:

```text
http://localhost:8000/system/user
```

## Gateway Mode

Use Higress when you want to verify the integrated browser entry:

```powershell
cd gateway
docker network create template-v6-observability
docker compose up -d
```

Then open:

```text
http://localhost:18080/user/login
```

The local Higress compose file defaults `HIGRESS_GATEWAY_CONCURRENCY` to `2` so
the all-in-one Envoy process stays stable on modest Docker Desktop memory
budgets. Override it only when your local Docker memory limit is comfortably
higher:

```powershell
$env:HIGRESS_GATEWAY_CONCURRENCY=4
docker compose up -d --force-recreate
```

See [gateway/README.md](gateway/README.md) and
[deploy/auth-gateway.local.md](deploy/auth-gateway.local.md) for route details.

## Common Commands

Backend:

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
buf generate --template buf.gen.yaml
go generate ./...
```

Frontend:

```powershell
cd web
npm run lint
npm run test
npm run build
```

Data dependencies:

```powershell
docker compose -f deploy/docker-compose.local.yml ps
docker compose -f deploy/docker-compose.local.yml exec mysql mysqladmin ping -h 127.0.0.1 -uroot -proot
docker compose -f deploy/docker-compose.local.yml exec redis redis-cli ping
```

## SDD Baseline

Spec Kit is initialized in Codex skills mode. Start with:

```text
.specify/memory/constitution.md
spec-kit-skill/SKILL.md
spec-kit-skill/references/spec-kit-workflows.md
AGENTS.md
```

Bootstrap spikes live in `specs/000-bootstrap/`. Real feature integration should
flow through `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, and
`$speckit-implement`.

The implemented feature specs are:

```text
specs/001-min-login-integration/
specs/002-admin-branding-login-ui/
specs/003-system-data-foundation/
specs/004-system-menu-management/
specs/005-system-role-management/
specs/006-system-user-management/
```

Use the SDD process for work that changes product behavior, API contracts,
database schema, permissions, gateway routing, observability, MCP integration,
or deployment boundaries. Small bootstrap checks can be recorded in
`specs/000-bootstrap/research.md`.

## Development Rules

- Keep all text files UTF-8.
- Keep frontend, backend, gateway, MCP, and observability modules independently
  runnable.
- Define contracts before frontend/backend/gateway integration.
- Keep Higress as routing only for the current baseline; Kratos owns auth and
  permission checks.
- Keep Prometheus and Grafana optional.
- Do not commit local runtime data, generated logs, `node_modules`, build
  outputs, or nested upstream repositories.

## Documentation Map

- [AGENTS.md](AGENTS.md): project rules for AI agents.
- [.specify/memory/constitution.md](.specify/memory/constitution.md): formal
  SDD constitution.
- [spec-kit-skill/SKILL.md](spec-kit-skill/SKILL.md): local Spec Kit operating
  guide.
- [docs/frontend/ant-design-pro-conventions.md](docs/frontend/ant-design-pro-conventions.md):
  frontend conventions.
- [docs/backend/kratos-conventions.md](docs/backend/kratos-conventions.md):
  backend conventions.
- [deploy/README.md](deploy/README.md): local MySQL and Redis guide.
- [specs/000-bootstrap/research.md](specs/000-bootstrap/research.md): verified
  runtime ports, commands, resource notes, and bootstrap history.
