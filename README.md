# go-ant-design-pro-admin

English | [简体中文](README.zh-CN.md)

SDD-driven admin framework template with Higress, Kratos, Ant Design Pro,
MySQL, Redis, and optional observability modules.

This repository is a reusable backend-admin template. Frontend, backend,
gateway, MCP, and observability modules remain independently runnable, while
Spec Kit / SDD artifacts drive product integration.

## What Is Included

- Ant Design Pro simple-mode admin frontend.
- Kratos Go backend service.
- MySQL-backed user, role, menu, module, and button-permission RBAC.
- Redis-backed local login token storage.
- Higress gateway entry for integrated local verification.
- Optional Prometheus and Grafana modules for larger projects.
- Spec Kit / SDD artifacts for the implemented baseline features.

## Project Layout

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

## Quick Start

1. Start MySQL and Redis:

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

The MySQL container mounts the same migration and seed SQL used by the Kratos
service. Docker runs these scripts only when the `mysql-data` volume is created
for the first time.

2. Start the Kratos backend:

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

The backend also runs embedded migration and seed scripts on startup, so an
existing local database is repaired or updated idempotently.

3. Start the frontend without mocks:

```powershell
cd web
npm install
npm run start:no-mock
```

4. Open:

```text
http://localhost:8000/user/login
```

Seeded local accounts:

| Username | Password | Access |
| --- | --- | --- |
| `admin` | `ant.design` | Full system management |
| `user` | `ant.design` | Basic user access |

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

## Reset Local Data

To rebuild MySQL from a clean seed:

```powershell
docker compose -f deploy/docker-compose.local.yml down
docker volume rm deploy_mysql-data
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

If Docker created the volume with another project prefix, run `docker volume ls`
and remove the matching `mysql-data` volume.

## Project Branding

Change the template name and description in:

```text
web/config/appConfig.ts
```

The frontend title, login page, footer, and visible starter pages read from this
configuration.

## Common Commands

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

Chinese SDD workspace entry: [specs/README.zh-CN.md](specs/README.zh-CN.md).

Use the SDD process for work that changes product behavior, API contracts,
database schema, permissions, gateway routing, observability, MCP integration,
or deployment boundaries.

## Development Rules

- Keep all text files UTF-8.
- Keep frontend, backend, gateway, MCP, and observability modules independently
  runnable.
- Define contracts before frontend/backend/gateway integration.
- Keep Higress as routing only for the current baseline; Kratos owns auth and
  permission checks.
- Keep Prometheus and Grafana optional.
- Do not commit local runtime data, logs, `node_modules`, build outputs, or
  nested upstream repositories.
