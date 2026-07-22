# Implementation Plan: System Menu Management

**Branch**: `004-system-menu-management` | **Date**: 2026-07-22 | **Spec**: `specs/004-system-menu-management/spec.md`

## Summary

Add menu permission CRUD backed by the system data foundation and expose an Ant
Design Pro System Management / Menu Management page.

## Technical Context

**Language/Version**: Go Kratos backend; TypeScript React frontend.

**Primary Dependencies**: Kratos protobuf-first APIs, MySQL data layer, Ant
Design, ProComponents, Umi Max access/menu conventions.

**Storage**: MySQL menu permission table and role-menu bindings from feature 003.

**Testing**: `go test ./...`, `go build`, `npm run lint`, `npm run test`,
`npm run build`, CRUD smoke tests.

**Target Platform**: Local admin template through direct ports and gateway route.

**Project Type**: Cross-module admin feature.

**Performance Goals**: Menu tree loads quickly for local admin datasets and is
stable enough for route generation.

**Constraints**: UTF-8, Ant Design Pro simple mode, Kratos layer boundaries,
backend authorization remains authoritative.

**Scale/Scope**: Menu CRUD and System Management navigation entry.

## Constitution Check

- Real feature with SDD artifacts before implementation.
- Touched modules: `server`, `web`, `docs`, `specs`.
- Out of scope: gateway auth, MCP, Prometheus, Grafana.
- Contracts are defined in `contracts/menu-api.yaml` before code changes.
- Frontend follows `docs/frontend/design.md` and
  `docs/frontend/ant-design-pro-conventions.md`.
- Backend follows `docs/backend/kratos-conventions.md`.
- Independent verification covers backend API and frontend page.
- UTF-8 is required; optional modules remain optional.

## Project Structure

```text
server/admin-service/api/system/v1/menu.proto
server/admin-service/internal/service/
server/admin-service/internal/biz/
server/admin-service/internal/data/
web/src/pages/System/Menu/
web/src/services/system/
web/src/access.ts
web/config/routes.ts
specs/004-system-menu-management/
```

**Structure Decision**: Use `api/system/v1` for RBAC management APIs and Ant
Design Pro route/access conventions for frontend menu visibility.

## Complexity Tracking

No constitution violations.
