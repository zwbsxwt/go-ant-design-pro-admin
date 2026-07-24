# Tasks: RustFS Avatar Upload And Display

**Input**: Design documents from `/specs/009-avatar-upload-rustfs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/avatar-upload-api.md, quickstart.md

**Tests**: Include backend tests, frontend tests, and manual upload smoke checks because this feature touches authenticated file upload and external object storage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` to point to `specs/009-avatar-upload-rustfs`
- [x] T002 Update `specs/README.zh-CN.md` with 009 avatar upload status entry
- [x] T003 Review existing profile API and page in `server/admin-service/api/profile/v1/profile.proto`, `server/admin-service/internal/biz/profile.go`, `server/admin-service/internal/data/profile.go`, `server/admin-service/internal/service/profile.go`, and `web/src/pages/Account/Profile/index.tsx`
- [x] T004 Review current user avatar typing and rendering in `web/src/services/ant-design-pro/typings.d.ts`, `web/src/app.tsx`, and `web/src/components/RightContent/AvatarDropdown.tsx`

---

## Phase 2: Foundational

**Purpose**: Define storage configuration, upload contract, and shared validation before user stories.

- [x] T005 Add non-secret object storage config fields in `server/admin-service/internal/conf/conf.proto`
- [x] T006 Add local config placeholders for object storage in `server/admin-service/configs/config.yaml`
- [x] T007 Regenerate Kratos config code from `server/admin-service`
- [x] T008 Add S3/RustFS storage adapter interface and implementation skeleton in `server/admin-service/internal/data/avatar_storage.go`
- [x] T009 Add avatar validation constants for supported MIME types and 2 MB max size in `server/admin-service/internal/biz/profile.go`
- [x] T010 Extend frontend profile service typing for avatar upload response in `web/src/services/ant-design-pro/typings.d.ts`
- [x] T011 Add frontend avatar upload request wrapper in `web/src/services/profile/profile.ts`

**Checkpoint**: Storage config and upload contracts exist, but upload is not wired to UI yet.

---

## Phase 3: User Story 1 - 上传个人头像 (Priority: P1) MVP

**Goal**: A signed-in user can upload a valid avatar from personal center and see it immediately.

**Independent Test**: Login as `admin`, open `/account/profile`, upload a valid image under 2 MB, and confirm the page shows the new avatar.

### Tests for User Story 1

- [x] T012 [P] [US1] Add backend avatar file validation tests in `server/admin-service/internal/biz/profile_test.go`
- [x] T013 [P] [US1] Add backend avatar storage adapter tests with mocked S3 behavior in `server/admin-service/internal/data/avatar_storage_test.go`
- [x] T014 [P] [US1] Add frontend avatar upload request tests in `web/src/services/profile/profile.test.ts`

### Implementation for User Story 1

- [x] T015 [US1] Extend profile protobuf or HTTP route contract for `POST /api/profile/avatar` in `server/admin-service/api/profile/v1/profile.proto`
- [x] T016 [US1] Regenerate Kratos protobuf, HTTP bindings, gRPC bindings, and OpenAPI output from `server/admin-service`
- [x] T017 [US1] Implement authenticated avatar upload validation in `server/admin-service/internal/biz/profile.go`
- [x] T018 [US1] Implement RustFS/S3 object upload and public URL composition in `server/admin-service/internal/data/avatar_storage.go`
- [x] T019 [US1] Persist the uploaded avatar URL to the current user in `server/admin-service/internal/data/profile.go`
- [x] T020 [US1] Implement ProfileService avatar upload handler in `server/admin-service/internal/service/profile.go`
- [x] T021 [US1] Register avatar upload HTTP route in `server/admin-service/internal/server/http.go`
- [x] T022 [US1] Add Ant Design Upload control to personal center in `web/src/pages/Account/Profile/index.tsx`
- [x] T023 [US1] Show upload progress, success, and validation errors in `web/src/pages/Account/Profile/index.tsx`

**Checkpoint**: User Story 1 is independently usable.

---

## Phase 4: User Story 2 - 全局展示当前头像 (Priority: P1)

**Goal**: Uploaded avatar appears consistently in currentUser, personal center, and the top-right user area.

**Independent Test**: Upload an avatar, refresh the page, and confirm both personal center and right-top avatar show the latest image.

### Tests for User Story 2

- [x] T024 [P] [US2] Add backend currentUser/profile avatar refresh tests in `server/admin-service/internal/data/profile_test.go`
- [x] T025 [P] [US2] Add frontend currentUser refresh behavior tests in `web/src/services/profile/profile.test.ts`

### Implementation for User Story 2

- [x] T026 [US2] Ensure `GET /api/profile` returns latest avatar from `server/admin-service/internal/data/profile.go`
- [x] T027 [US2] Ensure `GET /api/currentUser` returns latest avatar from existing auth/current user data flow in `server/admin-service/internal/data/auth.go`
- [x] T028 [US2] Refresh `initialState.currentUser` after successful avatar upload in `web/src/pages/Account/Profile/index.tsx`
- [x] T029 [US2] Ensure right-top avatar renders current user avatar in `web/src/components/RightContent/AvatarDropdown.tsx`
- [x] T030 [US2] Keep default avatar fallback when image URL fails in `web/src/components/RightContent/AvatarDropdown.tsx`

**Checkpoint**: User Story 2 is independently usable.

---

## Phase 5: User Story 3 - 管理员查看用户头像 (Priority: P2)

**Goal**: Administrators can see user avatar previews in user management without uploading avatars for other users.

**Independent Test**: Login as `admin`, open user management, and confirm users with avatars show avatar preview.

### Tests for User Story 3

- [x] T031 [P] [US3] Add frontend user management avatar display test or snapshot in `web/src/pages/System/User`

### Implementation for User Story 3

- [x] T032 [US3] Ensure system user list/detail API includes avatar field from `server/admin-service/internal/data/user.go`
- [x] T033 [US3] Render avatar preview in user management table or detail view in `web/src/pages/System/User`
- [x] T034 [US3] Confirm user management does not expose administrator avatar upload action in `web/src/pages/System/User`

**Checkpoint**: User Story 3 is independently usable.

---

## Phase 6: Polish & Validation

- [x] T035 Update `specs/009-avatar-upload-rustfs/quickstart.md` if commands, env vars, or routes change during implementation
- [x] T036 Add or update object storage local setup notes without secrets in `docs/` or `deploy/` if implementation needs them
- [x] T037 Run `go test ./...` from `server/admin-service`
- [x] T038 Run `go build -o ./bin/ ./cmd/admin-service` from `server/admin-service`
- [x] T039 Run `npm run lint` from `web`
- [x] T040 Run `npm run test` from `web`
- [x] T041 Run `npm run build` from `web`
- [x] T042 Smoke valid PNG/JPEG/WebP upload through direct `http://localhost:8000` and `http://localhost:18000`
- [x] T043 Smoke invalid type and oversized file rejection
- [x] T044 Smoke gateway flow at `http://localhost:18080`
- [x] T045 Confirm no real access key or secret key appears in Git-tracked files
- [x] T046 Update `specs/009-avatar-upload-rustfs/tasks.md` completed checkboxes after validation
- [x] T047 Update `specs/README.zh-CN.md` 009 status to `已完成` after validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all stories.
- **US1 上传个人头像**: Depends on Foundational and is the MVP.
- **US2 全局展示当前头像**: Depends on US1 upload result and can be completed immediately after MVP.
- **US3 管理员查看用户头像**: Depends on existing user management and can be implemented after US2 or in parallel if API already returns avatar.
- **Polish & Validation**: Depends on selected user stories being complete.

### Parallel Opportunities

- T003 and T004 can run in parallel.
- T012, T013, and T014 can run in parallel.
- T024 and T025 can run in parallel.
- Backend upload tasks T017-T021 and frontend upload tasks T022-T023 can be split after route contract generation.
- T032-T034 can run after user management API shape is confirmed.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 so users can upload and see an avatar in personal center.
3. Verify invalid files and oversized files before expanding global display.

### Incremental Delivery

1. Deliver authenticated upload and personal center display.
2. Refresh currentUser and top-right avatar display.
3. Add administrator read-only avatar preview in user management.
4. Run direct and gateway smoke after each story.

### Notes

- Do not commit RustFS access key or secret key.
- Do not expose object storage credentials to the browser.
- Keep object storage optional for small-project templates unless avatar upload is enabled.
- Do not change Higress authentication in this feature.
