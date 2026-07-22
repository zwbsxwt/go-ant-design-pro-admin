# Implementation Plan: System Role Management

**Branch**: `005-system-role-management` | **Date**: 2026-07-22 | **Spec**: `specs/005-system-role-management/spec.md`

## Summary

Add role CRUD and role-to-menu/button permission binding, replacing hard-coded
role assumptions with database-backed role data.

## Technical Context

**Language/Version**: Go Kratos backend; TypeScript React frontend.

**Primary Dependencies**: Kratos protobuf-first APIs, MySQL RBAC tables, Ant
Design, ProComponents, Umi Max access conventions.

**Storage**: MySQL roles and role-menu binding tables from feature 003.

**Testing**: Backend tests/build, frontend lint/test/build, role CRUD smoke test,
permission refresh verification.

**Target Platform**: Local admin template.

**Project Type**: Cross-module admin feature.

**Performance Goals**: Role list and permission tree interactions remain usable
for typical admin-template datasets.

**Constraints**: UTF-8, backend authorization authoritative, Higress routing only.

**Scale/Scope**: Role CRUD plus permission binding UI and API.

## Constitution Check

- Real feature with SDD artifacts before implementation.
- Touched modules: `server`, `web`, `docs`, `specs`.
- Out of scope: gateway auth, MCP, Prometheus, Grafana, user CRUD.
- Contracts are defined in `contracts/role-api.yaml`.
- Frontend and backend convention docs apply.
- Verification covers backend API, frontend page, and current-user payload.
- UTF-8 is required; optional modules remain optional.

## Project Structure

```text
server/admin-service/api/system/v1/role.proto
server/admin-service/internal/service/
server/admin-service/internal/biz/
server/admin-service/internal/data/
web/src/pages/System/Role/
web/src/services/system/
web/src/access.ts
specs/005-system-role-management/
```

**Structure Decision**: Reuse `api/system/v1` and the existing RBAC tables from
data foundation/menu management.

## Complexity Tracking

No constitution violations.
