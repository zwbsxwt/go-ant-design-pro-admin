# Implementation Plan: Admin Branding And Login UI

**Branch**: `002-admin-branding-login-ui` | **Date**: 2026-07-22 | **Spec**: `specs/002-admin-branding-login-ui/spec.md`

**Input**: Feature specification from `/specs/002-admin-branding-login-ui/spec.md`

## Summary

Rename the visible admin product identity to `go-ant-design-pro-admin` across the
Ant Design Pro simple-mode frontend while preserving framework references in
developer documentation.

## Technical Context

**Language/Version**: TypeScript with React 19 and Umi Max 4.

**Primary Dependencies**: Ant Design 6, Ant Design Pro simple mode,
`@ant-design/pro-components`, `@umijs/max`.

**Storage**: N/A.

**Testing**: `npm run lint`, `npm run test`, `npm run build`, browser smoke test.

**Target Platform**: Local admin web application.

**Project Type**: Monorepo frontend feature.

**Performance Goals**: Branding changes must not add runtime dependencies or
observable page-load delay.

**Constraints**: Preserve UTF-8; preserve simple mode; keep framework references
only where they are intentionally documentation-oriented.

**Scale/Scope**: Login page, app settings, manifest, footer, and starter pages.

## Constitution Check

- This is a real frontend feature, so spec, plan, and tasks are present before
  implementation.
- Touched modules: `web`, `docs`, `specs`.
- Out of scope: `gateway`, `server`, `mcp`, `prometheus`, `grafana`, `deploy`.
- No API, route, auth, permission, or data contracts change.
- Frontend work applies `docs/frontend/design.md` and
  `docs/frontend/ant-design-pro-conventions.md`.
- Verification uses independent frontend checks and browser inspection.
- UTF-8 is required for all modified files.
- Optional observability and MCP modules remain optional.

## Project Structure

```text
web/config/                         # title and layout settings
web/src/manifest.json               # PWA/application metadata
web/src/components/Footer/           # global footer text/link behavior
web/src/pages/user/login/            # login page branding
web/src/pages/Welcome.tsx            # starter page copy
web/src/pages/Admin.tsx              # starter admin placeholder copy
docs/frontend/                       # Ant Design references remain framework docs
specs/002-admin-branding-login-ui/   # this feature's SDD artifacts
```

**Structure Decision**: Keep all product rename edits inside `web/`, with docs
only used as governing references.

## Complexity Tracking

No constitution violations.
