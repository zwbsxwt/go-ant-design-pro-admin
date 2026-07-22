# Implementation Plan: System Data Foundation

**Branch**: `003-system-data-foundation` | **Date**: 2026-07-22 | **Spec**: `specs/003-system-data-foundation/spec.md`

**Input**: Feature specification from `/specs/003-system-data-foundation/spec.md`

## Summary

Add Docker-managed MySQL and Redis as the local data foundation, plan durable
RBAC seed data, and keep Grafana/Prometheus as optional observability modules.

## Technical Context

**Language/Version**: Go for Kratos backend; YAML/Markdown for deployment and
documentation.

**Primary Dependencies**: Kratos config, Go MySQL driver or ORM selected by the
implementation, Redis client selected by the implementation, Docker Compose.

**Storage**: MySQL for durable RBAC data; Redis for cache/session support.

**Testing**: `go test ./...`, `go build -o ./bin/ ./cmd/admin-service`, Docker
container health checks, MySQL and Redis smoke connections.

**Target Platform**: Local Docker Desktop with 8G memory budget and Windows
developer workflow.

**Project Type**: Backend infrastructure and deployment feature.

**Performance Goals**: Local login/current-user checks remain responsive for
seeded users; cache rebuild from database is acceptable for development.

**Constraints**: Secrets out of Git, UTF-8 text files, observability optional,
backend layers follow Kratos conventions.

**Scale/Scope**: Local template data foundation for users, roles, menus, button
permissions, and bindings.

## Constitution Check

- This is a real architecture-affecting feature and has SDD artifacts before
  implementation.
- Touched modules: `server`, `deploy`, `docs`, `specs`.
- Out of scope: `web`, `gateway`, `mcp`, `prometheus`, `grafana`.
- Data contracts are defined before replacing in-memory auth.
- Backend work follows `docs/backend/kratos-conventions.md`.
- Independent verification covers MySQL, Redis, and backend startup.
- UTF-8 is required.
- Prometheus and Grafana remain optional.

## Project Structure

```text
server/admin-service/internal/conf/      # database and redis config schema
server/admin-service/configs/            # local config defaults
server/admin-service/internal/data/      # data clients and repositories
server/admin-service/internal/biz/       # repository contracts and seed usecases
deploy/                                 # docker-compose and local dependency docs
docs/                                   # local data foundation guide
specs/003-system-data-foundation/        # this feature's SDD artifacts
```

**Structure Decision**: Keep runtime dependency definitions in `deploy/`, while
backend data access stays inside Kratos `internal/data`.

## Complexity Tracking

No constitution violations.
