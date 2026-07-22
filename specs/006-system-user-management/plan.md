# Implementation Plan: System User Management

**Branch**: `006-system-user-management` | **Date**: 2026-07-22 | **Spec**: `specs/006-system-user-management/spec.md`

## Summary

Add user CRUD, account status control, password reset, role binding, and
database-backed login/current-user permission resolution.

## Technical Context

**Language/Version**: Go Kratos backend; TypeScript React frontend.

**Primary Dependencies**: Kratos protobuf-first APIs, MySQL RBAC tables, Redis
cache where useful, Ant Design, ProComponents, Umi Max access conventions.

**Storage**: MySQL users, credentials, roles, role bindings, menu/button
permissions; Redis for derived session or permission cache if implemented.

**Testing**: Backend tests/build, frontend lint/test/build, account lifecycle
smoke tests, admin/user permission comparison.

**Target Platform**: Local admin template through direct ports and gateway route.

**Project Type**: Cross-module admin feature.

**Performance Goals**: User list and current-user permission resolution remain
responsive for local template datasets.

**Constraints**: UTF-8, backend authorization authoritative, no gateway JWT auth
in this feature.

**Scale/Scope**: User CRUD, reset password, role binding, login/current-user
database integration.

## Constitution Check

- Real feature with SDD artifacts before implementation.
- Touched modules: `server`, `web`, `docs`, `specs`.
- Out of scope: gateway auth, MCP, Prometheus, Grafana, SSO, audit logs.
- Contracts are defined in `contracts/user-api.yaml` and
  `contracts/current-user-extension.md`.
- Frontend and backend convention docs apply.
- Verification covers backend, frontend, direct-port integration, and gateway
  entry routing.
- UTF-8 is required; optional modules remain optional.

## Project Structure

```text
server/admin-service/api/system/v1/user.proto
server/admin-service/api/auth/v1/auth.proto
server/admin-service/internal/service/
server/admin-service/internal/biz/
server/admin-service/internal/data/
web/src/pages/System/User/
web/src/services/system/
web/src/services/admin/
web/src/access.ts
specs/006-system-user-management/
```

**Structure Decision**: Keep user CRUD in `api/system/v1`, while extending the
existing auth/current-user API only for permission payload resolution.

## Complexity Tracking

No constitution violations.
