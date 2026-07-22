# Tasks: System User Management

**Input**: Design documents from `/specs/006-system-user-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Review user API contract in specs/006-system-user-management/contracts/user-api.yaml
- [x] T002 Review current-user extension in specs/006-system-user-management/contracts/current-user-extension.md
- [x] T003 Confirm features 003, 004, and 005 are implemented
- [x] T004 Review frontend and backend conventions in docs/

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Define user protobuf API in server/admin-service/api/system/v1/user.proto
- [x] T006 Extend auth/current-user protobuf payload in server/admin-service/api/auth/v1/auth.proto
- [x] T007 Extend system error reasons in server/admin-service/api/system/v1/error_reason.proto
- [x] T008 Regenerate Kratos API and OpenAPI bindings under server/admin-service/api/
- [x] T009 Add user management route/access constants in web/config/routes.ts and web/src/access.ts
- [x] T010 Update frontend current-user typings in web/src/services/ant-design-pro/typings.d.ts

---

## Phase 3: User Story 1 - Browse Users (Priority: P1) MVP

**Goal**: Admin can view users and role summaries.

**Independent Test**: Admin opens User Management and sees seeded users.

- [x] T011 [P] [US1] Add user entity and repository interface in server/admin-service/internal/biz/user.go
- [x] T012 [P] [US1] Add user repository list/get implementation in server/admin-service/internal/data/user.go
- [x] T013 [US1] Add user list/get usecases in server/admin-service/internal/biz/user.go
- [x] T014 [US1] Add user list/get service methods in server/admin-service/internal/service/user.go
- [x] T015 [P] [US1] Add frontend user service wrapper in web/src/services/system/user.ts
- [x] T016 [US1] Add User Management table page in web/src/pages/System/User/index.tsx

---

## Phase 4: User Story 2 - Maintain User Accounts (Priority: P2)

**Goal**: Admin can create, update, enable/disable, and reset passwords.

**Independent Test**: Create user, disable login, reset password, and confirm behavior.

- [x] T017 [US2] Add user create/update/delete repository methods in server/admin-service/internal/data/user.go
- [x] T018 [US2] Add password hash/reset repository behavior in server/admin-service/internal/data/user.go
- [x] T019 [US2] Add username uniqueness, status, and reset validation in server/admin-service/internal/biz/user.go
- [x] T020 [US2] Add user mutation and password reset service methods in server/admin-service/internal/service/user.go
- [x] T021 [US2] Add user create/edit forms in web/src/pages/System/User/index.tsx
- [x] T022 [US2] Add enable/disable and reset password actions in web/src/pages/System/User/index.tsx

---

## Phase 5: User Story 3 - Bind User Roles And Resolve Permissions (Priority: P3)

**Goal**: User role bindings drive login/current-user permissions.

**Independent Test**: Change user roles and verify current-user permission payload changes.

- [x] T023 [US3] Add user-role binding repository methods in server/admin-service/internal/data/user.go
- [x] T024 [US3] Add user-role binding usecase validation in server/admin-service/internal/biz/user.go
- [x] T025 [US3] Add user role binding service method in server/admin-service/internal/service/user.go
- [x] T026 [US3] Update login lookup to read database users in server/admin-service/internal/data/auth.go
- [x] T027 [US3] Update current-user resolution in server/admin-service/internal/data/auth.go
- [x] T028 [US3] Add role selection UI in web/src/pages/System/User/index.tsx
- [x] T029 [US3] Update frontend access map/helper for button permission codes in web/src/access.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T030 Run `go test ./...` from server/admin-service
- [x] T031 Run `go build -o ./bin/ ./cmd/admin-service` from server/admin-service
- [x] T032 Run `npm run lint` from web
- [x] T033 Run `npm run test` from web
- [x] T034 Run `npm run build` from web
- [x] T035 Verify admin/user permission differences through direct ports and gateway entry
  - Direct-port API smoke passed on temporary Kratos `18005`.
  - Frontend browser smoke passed on temporary Ant Design Pro `8005`.
  - Gateway API smoke passed through `http://localhost:18080/api/*`.
  - Gateway browser smoke passed through `http://localhost:18080/system/user`:
    admin can see User Management, normal user receives 403.
- [x] T036 Update docs and specs/000-bootstrap/research.md if runtime behavior changes

## Dependencies & Execution Order

- Features 003, 004, and 005 are prerequisites.
- Phase 2 blocks all stories.
- US1 is MVP; US2 depends on US1; US3 depends on roles and menu permissions.

## Parallel Opportunities

- Backend user repository setup and frontend service wrapper can run in parallel
  after protobuf generation.

## Implementation Strategy

Deliver read-only user list, then account lifecycle, then role binding and
current-user permission resolution.
