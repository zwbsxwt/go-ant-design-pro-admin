# Implementation Plan: Personal Center And Password Settings

**Branch**: `008-profile-settings` | **Date**: 2026-07-23 | **Spec**: `specs/008-profile-settings/spec.md`

**Input**: Feature specification from `/specs/008-profile-settings/spec.md`

## Summary

Add a personal center for the signed-in user, allowing profile self-service
updates for display name, email, and phone, plus current-password-verified
password changes. Avatar upload is intentionally excluded until a future
S3-compatible object-storage feature.

## Technical Context

**Language/Version**: Go 1.25.7 for Kratos backend; TypeScript/React 19 with Ant Design Pro and Umi Max for frontend.

**Primary Dependencies**: Kratos v3 protobuf-first HTTP/gRPC service; Ant Design Pro simple mode; Ant Design and ProComponents.

**Storage**: Existing MySQL `system_users` table for profile and password hash; existing Redis token store for login token revocation.

**Testing**: `go test ./...`, `go build -o ./bin/ ./cmd/admin-service`, `npm run lint`, `npm run test`, `npm run build`, direct and gateway smoke checks.

**Target Platform**: Local Windows development with Docker MySQL/Redis, Kratos HTTP on `18000`, Ant Design Pro on `8000`, Higress gateway on `18080`.

**Project Type**: Monorepo admin web application with Kratos backend and Ant Design Pro frontend.

**Performance Goals**: Personal center loads within normal currentUser page timing; save actions complete quickly enough for normal admin UI interaction.

**Constraints**: Preserve UTF-8, do not add object storage, do not add new required runtime dependencies, keep Higress as route forwarding only.

**Scale/Scope**: One personal center page, two backend self-service operations, current-user state refresh, no multi-tenant profile model.

## Constitution Check

- This is a real feature, not a bootstrap spike. It has `spec.md`, `plan.md`, `tasks.md`, and contracts before implementation.
- Touched modules: `server/`, `web/`, `specs/`. Optional `docs/` may be updated only if guidance changes.
- Out of scope: `gateway/`, `mcp/`, `prometheus/`, `grafana/`, `deploy/`.
- API, auth, permission, and data contracts are defined in `contracts/profile-api.md`.
- Frontend work must follow `docs/frontend/ant-design-pro-conventions.md`.
- Backend work must follow `docs/backend/kratos-conventions.md`.
- Verification covers backend, frontend, and integrated direct/gateway paths.
- All text files must remain UTF-8.
- Prometheus, Grafana, MCP, and object storage remain optional and untouched.

## Project Structure

### Documentation (this feature)

```text
specs/008-profile-settings/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
server/admin-service/api/profile/v1/          # new self-service protobuf API
server/admin-service/internal/biz/            # profile usecase and repo contract
server/admin-service/internal/data/           # profile persistence and token revocation
server/admin-service/internal/service/        # profile service handlers
server/admin-service/internal/server/         # profile HTTP/gRPC registration
web/config/routes.ts                          # personal center route whitelist entry
web/src/components/RightContent/              # avatar dropdown personal center entry
web/src/pages/Account/Profile/                # personal center page
web/src/services/profile/                     # personal profile requests
web/src/services/ant-design-pro/typings.d.ts  # profile request/response types
specs/008-profile-settings/                   # SDD artifacts
```

**Structure Decision**: Add a dedicated `profile` API namespace for current-user self-service instead of extending administrator `system/users` APIs. This keeps “manage other users” and “manage myself” permissions separate.

## Complexity Tracking

No constitution violations identified.
