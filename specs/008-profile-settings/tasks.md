# Tasks: Personal Center And Password Settings

**Input**: Design documents from `/specs/008-profile-settings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/profile-api.md, quickstart.md

**Tests**: Include backend unit/integration checks and frontend validation because this feature touches authentication and password behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` to point to `specs/008-profile-settings`
- [x] T002 Update `specs/README.zh-CN.md` with 008 personal center status entry
- [x] T003 Review existing auth/user/profile-adjacent code in `server/admin-service/internal/data/auth.go`, `server/admin-service/internal/data/user.go`, and `web/src/components/RightContent/AvatarDropdown.tsx`

---

## Phase 2: Foundational

**Purpose**: Define the self-service profile contract and shared frontend/backend foundations.

- [x] T004 Create profile protobuf contract in `server/admin-service/api/profile/v1/profile.proto`
- [x] T005 Regenerate Kratos protobuf, HTTP bindings, gRPC bindings, and OpenAPI output from `server/admin-service`
- [x] T006 Register ProfileService in `server/admin-service/internal/server/http.go`, `server/admin-service/internal/server/grpc.go`, and Wire provider setup
- [x] T007 Add frontend profile service request wrappers in `web/src/services/profile/profile.ts`
- [x] T008 Extend frontend API typings for profile requests and responses in `web/src/services/ant-design-pro/typings.d.ts`
- [x] T009 Add protected personal center route `/account/profile` in `web/config/routes.ts`

**Checkpoint**: Profile API and route contracts exist, but stories are not implemented yet.

---

## Phase 3: User Story 1 - 查看个人中心 (Priority: P1) MVP

**Goal**: A signed-in user can open personal center and view their own account profile.

**Independent Test**: Login as `admin`, open `/account/profile`, and confirm only current user profile fields are displayed.

### Tests for User Story 1

- [x] T010 [P] [US1] Add backend profile query tests in `server/admin-service/internal/data/profile_test.go`
- [x] T011 [P] [US1] Add frontend profile service contract tests in `web/src/services/profile/profile.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Add Profile usecase and repository interfaces in `server/admin-service/internal/biz/profile.go`
- [x] T013 [US1] Implement current-user profile query in `server/admin-service/internal/data/profile.go`
- [x] T014 [US1] Implement ProfileService `GetProfile` handler in `server/admin-service/internal/service/profile.go`
- [x] T015 [US1] Create personal center page shell in `web/src/pages/Account/Profile/index.tsx`
- [x] T016 [US1] Add avatar dropdown `个人中心` entry in `web/src/components/RightContent/AvatarDropdown.tsx`
- [x] T017 [US1] Render current username, display name, avatar preview, email, phone, role codes, and status in `web/src/pages/Account/Profile/index.tsx`

**Checkpoint**: User Story 1 is independently usable.

---

## Phase 4: User Story 2 - 修改个人资料 (Priority: P1)

**Goal**: A signed-in user can update display name, email, and phone without changing privileged fields.

**Independent Test**: Login as `admin`, update display name/email/phone, refresh, and confirm the saved values remain and currentUser display updates.

### Tests for User Story 2

- [x] T018 [P] [US2] Add backend profile update validation tests in `server/admin-service/internal/biz/profile_test.go`
- [x] T019 [P] [US2] Add frontend profile update request tests in `web/src/services/profile/profile.test.ts`

### Implementation for User Story 2

- [x] T020 [US2] Implement profile update validation in `server/admin-service/internal/biz/profile.go`
- [x] T021 [US2] Implement current-user profile update persistence in `server/admin-service/internal/data/profile.go`
- [x] T022 [US2] Implement ProfileService `UpdateProfile` handler in `server/admin-service/internal/service/profile.go`
- [x] T023 [US2] Build profile edit form using Ant Design Pro components in `web/src/pages/Account/Profile/index.tsx`
- [x] T024 [US2] Refresh initialState currentUser after profile save in `web/src/pages/Account/Profile/index.tsx`
- [x] T025 [US2] Ensure username, avatar, role, status, menu permissions, and button permissions cannot be submitted from `web/src/pages/Account/Profile/index.tsx`

**Checkpoint**: User Story 2 is independently usable.

---

## Phase 5: User Story 3 - 修改登录密码 (Priority: P1)

**Goal**: A signed-in user can change their own password after verifying the current password.

**Independent Test**: Login as `admin`, change password with correct current password, confirm redirect to login, old password fails, new password succeeds.

### Tests for User Story 3

- [x] T026 [P] [US3] Add backend password change tests in `server/admin-service/internal/data/profile_test.go`
- [x] T027 [P] [US3] Add frontend password change request tests in `web/src/services/profile/profile.test.ts`

### Implementation for User Story 3

- [x] T028 [US3] Implement password change validation in `server/admin-service/internal/biz/profile.go`
- [x] T029 [US3] Implement current-password verification and password hash update in `server/admin-service/internal/data/profile.go`
- [x] T030 [US3] Revoke current token after password change in `server/admin-service/internal/data/profile.go`
- [x] T031 [US3] Implement ProfileService `ChangePassword` handler in `server/admin-service/internal/service/profile.go`
- [x] T032 [US3] Build password change form in `web/src/pages/Account/Profile/index.tsx`
- [x] T033 [US3] Clear local auth state and redirect to `/user/login` after successful password change in `web/src/pages/Account/Profile/index.tsx`

**Checkpoint**: User Story 3 is independently usable.

---

## Phase 6: Polish & Validation

- [x] T034 Update `specs/008-profile-settings/quickstart.md` if any verification command or route changes during implementation
- [x] T035 Run `go test ./...` from `server/admin-service`
- [x] T036 Run `go build -o ./bin/ ./cmd/admin-service` from `server/admin-service`
- [x] T037 Run `npm run lint` from `web`
- [x] T038 Run `npm run test` from `web`
- [x] T039 Run `npm run build` from `web`
- [x] T040 Smoke direct flow at `http://localhost:8000` with `http://localhost:18000`
- [x] T041 Smoke gateway flow at `http://localhost:18080`
- [x] T042 Update `specs/008-profile-settings/tasks.md` completed checkboxes after validation
- [x] T043 Update `specs/README.zh-CN.md` 008 status to `已完成` after validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all stories.
- **US1 查看个人中心**: Depends on Foundational and is the MVP.
- **US2 修改个人资料**: Depends on US1 page and profile query foundation.
- **US3 修改登录密码**: Depends on Foundational and can be implemented alongside US2 after US1 page shell exists.
- **Polish & Validation**: Depends on selected user stories being complete.

### Parallel Opportunities

- T010 and T011 can run in parallel.
- T018 and T019 can run in parallel.
- T026 and T027 can run in parallel.
- Backend implementation T020-T022 and frontend implementation T023-T025 can be split after contract generation.
- Backend implementation T028-T031 and frontend implementation T032-T033 can be split after contract generation.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 so users can enter personal center and view their own profile.
3. Validate direct route and token protection before profile updates.

### Incremental Delivery

1. Deliver US1 profile view.
2. Add US2 profile edit.
3. Add US3 password change.
4. Run direct and gateway smoke after each story.

### Notes

- Keep avatar upload out of implementation.
- Keep personal self-service separate from administrator `/api/system/users`.
- Preserve UTF-8 for Chinese UI labels and SDD documents.
