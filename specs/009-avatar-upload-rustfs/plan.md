# Implementation Plan: RustFS Avatar Upload And Display

**Branch**: `009-avatar-upload-rustfs` | **Date**: 2026-07-23 | **Spec**: `specs/009-avatar-upload-rustfs/spec.md`

**Input**: Feature specification from `/specs/009-avatar-upload-rustfs/spec.md`

## Summary

Add S3-compatible avatar upload to the existing personal center. The backend receives authenticated multipart uploads, validates file type and size, stores the image in RustFS, updates the current user's avatar field, and returns the new avatar URL. The frontend adds an upload control to personal center and refreshes current user state so the avatar appears in personal center and the right-top avatar area.

## Technical Context

**Language/Version**: Go 1.25.7 for Kratos backend; TypeScript/React 19 with Ant Design Pro and Umi Max for frontend.

**Primary Dependencies**: Kratos protobuf-first HTTP/gRPC service; Ant Design Pro simple mode; Ant Design Upload/Avatar components; S3-compatible object storage client for RustFS integration.

**Storage**: Existing MySQL `system_users.avatar` field stores the avatar URL. RustFS/S3-compatible bucket stores image objects. Redis remains unchanged.

**Testing**: `go test ./...`, `go build -o ./bin/ ./cmd/admin-service`, `npm run lint`, `npm run test`, `npm run build`, direct and gateway smoke checks, upload validation with valid and invalid files.

**Target Platform**: Local Windows development with Docker MySQL/Redis, Kratos HTTP on `18000`, Ant Design Pro on `8000`, Higress gateway on `18080`, external RustFS endpoint configured by environment variables.

**Project Type**: Monorepo admin web application with Kratos backend and Ant Design Pro frontend.

**Performance Goals**: Upload of a valid avatar under 2 MB completes within normal admin UI interaction time on local network; profile/currentUser refresh shows the new avatar after one successful upload.

**Constraints**: Preserve UTF-8, keep object storage credentials out of Git, keep Higress as route forwarding only, keep RustFS optional outside avatar feature, avoid direct browser access to access key/secret key.

**Scale/Scope**: One self-service avatar upload endpoint, personal center upload UI, currentUser/profile avatar display refresh, no image cropping or old-object cleanup.

## Constitution Check

- This is real product behavior and has `spec.md`, `plan.md`, `tasks.md`, and contracts before implementation.
- Touched modules: `server/`, `web/`, `specs/`; optional docs for object storage setup.
- Out of scope: `gateway/` auth changes, `mcp/`, `prometheus/`, `grafana/`.
- API, auth, storage, and frontend contracts are defined in `contracts/avatar-upload-api.md`.
- Frontend work must follow `docs/frontend/ant-design-pro-conventions.md` and `docs/frontend/design.md`.
- Backend work must follow `docs/backend/kratos-conventions.md`.
- Verification covers backend, frontend, RustFS storage behavior, direct access, and gateway path.
- All text files must remain UTF-8.
- Secrets must stay in local environment variables or private deployment configuration only.

## Project Structure

### Documentation (this feature)

```text
specs/009-avatar-upload-rustfs/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- avatar-upload-api.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
server/admin-service/api/profile/v1/          # extend profile API with avatar upload
server/admin-service/internal/biz/            # avatar validation and usecase contract
server/admin-service/internal/data/           # RustFS/S3 upload and user avatar persistence
server/admin-service/internal/conf/           # object storage runtime configuration
server/admin-service/internal/service/        # avatar upload HTTP handler
server/admin-service/configs/                 # non-secret config keys and defaults
web/src/pages/Account/Profile/                # avatar upload UI
web/src/services/profile/                     # upload request wrapper
web/src/services/ant-design-pro/typings.d.ts  # avatar response types
specs/009-avatar-upload-rustfs/               # SDD artifacts
```

**Structure Decision**: Extend the existing `profile` self-service namespace instead of administrator `system/users` APIs. Avatar upload is a current-user self-service action, not a user-management action.

## Complexity Tracking

No constitution violations identified.
