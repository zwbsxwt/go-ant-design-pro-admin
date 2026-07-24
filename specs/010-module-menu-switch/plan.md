# Implementation Plan: Module Menu Switch

**Branch**: `010-module-menu-switch` | **Date**: 2026-07-23 | **Spec**: `specs/010-module-menu-switch/spec.md`

## Summary

Add a module layer above the existing database-driven menu tree. The backend stores modules, associates every menu with a module, returns authorized modules in `currentUser`, and keeps role permissions menu/button based. The frontend renders a right-top module selector and filters the left navigation by the selected module while preserving the static route/component whitelist.

## Technical Context

**Language/Version**: Go 1.25.7 for Kratos backend; TypeScript/React 19 with Ant Design Pro and Umi Max for frontend.

**Primary Dependencies**: Kratos protobuf-first HTTP/gRPC APIs; Ant Design Pro layout runtime; Ant Design dropdown/select controls.

**Storage**: MySQL adds `system_modules`; `system_menus` gains `module_id`. Redis unchanged.

**Testing**: `go test ./...`, `go build -o ./bin/ ./cmd/admin-service`, `npm run lint`, `npm run test`, `npm run build`, direct and gateway smoke checks.

**Target Platform**: Local Windows development with MySQL/Redis, Kratos HTTP `18000`, Ant Design Pro `8000`, Higress gateway `18080`.

**Project Type**: Monorepo admin web application.

**Constraints**: Preserve UTF-8, do not introduce micro-frontend loading, keep Higress routing-only, keep module permissions derived from menu permissions.

## Constitution Check

- This feature has SDD artifacts before code implementation.
- Touched modules: `server/`, `web/`, `specs/`.
- Out of scope: `gateway/` auth changes, `mcp/`, `prometheus/`, `grafana/`.
- API and UI contracts are captured in `contracts/module-menu-api.md`.
- Frontend must follow Ant Design Pro conventions and local Ant Design design guidance.
- Backend must follow Kratos protobuf-first and service/biz/data layering.
- All text files must remain UTF-8.

## Project Structure

```text
server/admin-service/api/system/v1/module.proto
server/admin-service/api/system/v1/menu.proto
server/admin-service/api/auth/v1/auth.proto
server/admin-service/internal/biz/module.go
server/admin-service/internal/biz/menu.go
server/admin-service/internal/data/module.go
server/admin-service/internal/data/menu.go
server/admin-service/internal/data/init.go
server/admin-service/internal/data/migrations/
server/admin-service/internal/data/seeds/
server/admin-service/internal/service/module.go
server/admin-service/internal/service/menu.go
server/admin-service/internal/service/auth.go
server/admin-service/internal/server/http.go
server/admin-service/internal/server/grpc.go
web/src/app.tsx
web/src/components/RightContent/ModuleSwitch.tsx
web/src/pages/System/Menu/index.tsx
web/src/pages/System/Module/index.tsx
web/src/services/system/module.ts
web/src/services/system/menu.ts
web/src/services/ant-design-pro/typings.d.ts
```

## Complexity Tracking

No constitution violations identified.
