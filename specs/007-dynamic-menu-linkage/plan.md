# Implementation Plan: Dynamic Menu Linkage

**Branch**: `007-dynamic-menu-linkage` | **Date**: 2026-07-23 | **Spec**: `specs/007-dynamic-menu-linkage/spec.md`

## Summary

Return authorized database menu trees from currentUser, seed built-in menu names
in Chinese, and make Ant Design Pro left navigation render from that authorized
tree while preserving frontend route/component whitelist safety.

## Technical Context

**Backend**: Kratos Go, protobuf-first auth API, MySQL RBAC tables.

**Frontend**: Ant Design Pro simple mode, Umi Max runtime layout, static
`config/routes.ts` route registration.

**Constraints**: UTF-8 text, permission codes unchanged, no runtime dynamic
component loading, Higress routing only.

## Structure

```text
server/admin-service/api/auth/v1/auth.proto
server/admin-service/internal/biz/auth.go
server/admin-service/internal/data/auth.go
server/admin-service/internal/service/auth.go
server/admin-service/internal/data/seeds/001_seed_rbac.sql
web/config/routes.ts
web/src/app.tsx
web/src/services/admin/auth.ts
web/src/services/ant-design-pro/typings.d.ts
specs/007-dynamic-menu-linkage/
```

## Design Decisions

- Extend currentUser instead of adding another menu endpoint, so initial
  navigation and permissions are resolved together.
- Return only directory/page resources in `menus`; buttons remain in
  `button_permissions`.
- Build frontend menu data by matching database menu entries to existing static
  routes by `permissionCode` or `path`.
- Unknown database pages are ignored to prevent arbitrary component routing.
- Database seed names are Chinese, while route locale keys can remain as
  fallback labels.
