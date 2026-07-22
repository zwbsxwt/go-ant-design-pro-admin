# Tasks: System Role Management

**Input**: Design documents from `/specs/005-system-role-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Review role API contract in specs/005-system-role-management/contracts/role-api.yaml
- [x] T002 Confirm feature 003 RBAC persistence exists under server/admin-service/internal/data/
- [x] T003 Confirm feature 004 menu tree API exists under server/admin-service/api/system/v1/menu.proto
- [x] T004 Review frontend and backend conventions in docs/

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Define role protobuf API in server/admin-service/api/system/v1/role.proto
- [x] T006 Extend system error reasons in server/admin-service/api/system/v1/error_reason.proto
- [x] T007 Regenerate Kratos API and OpenAPI bindings under server/admin-service/api/system/v1/
- [x] T008 Add role management route/access constants in web/config/routes.ts and web/src/access.ts
- [x] T009 Ensure current-user payload supports role, menu, and button codes from database

---

## Phase 3: User Story 1 - Browse Roles (Priority: P1) MVP

**Goal**: Admin can view seeded roles.

**Independent Test**: Admin opens Role Management and sees `admin` and `user`.

- [x] T010 [P] [US1] Add role entity and repository interface in server/admin-service/internal/biz/role.go
- [x] T011 [P] [US1] Add role repository list/get implementation in server/admin-service/internal/data/role.go
- [x] T012 [US1] Add role list/get usecases in server/admin-service/internal/biz/role.go
- [x] T013 [US1] Add role list/get service methods in server/admin-service/internal/service/role.go
- [x] T014 [P] [US1] Add frontend role service wrapper in web/src/services/system/role.ts
- [x] T015 [US1] Add Role Management table page in web/src/pages/System/Role/index.tsx

---

## Phase 4: User Story 2 - Maintain Roles (Priority: P2)

**Goal**: Admin can create, update, enable/disable, and safely delete roles.

**Independent Test**: Create, edit, disable, and delete an unbound role.

- [x] T016 [US2] Add role create/update/delete repository methods in server/admin-service/internal/data/role.go
- [x] T017 [US2] Add role code uniqueness and delete safety rules in server/admin-service/internal/biz/role.go
- [x] T018 [US2] Add role mutation service methods in server/admin-service/internal/service/role.go
- [x] T019 [US2] Add role create/edit forms in web/src/pages/System/Role/index.tsx
- [x] T020 [US2] Add delete confirmation and disabled status behavior in web/src/pages/System/Role/index.tsx

---

## Phase 5: User Story 3 - Bind Role Permissions (Priority: P3)

**Goal**: Admin can bind menu and button permissions to roles.

**Independent Test**: Change a role's permission tree and verify current-user output changes.

- [x] T021 [US3] Add role permission binding repository methods in server/admin-service/internal/data/role.go
- [x] T022 [US3] Add permission binding usecase validation in server/admin-service/internal/biz/role.go
- [x] T023 [US3] Add role permission update service method in server/admin-service/internal/service/role.go
- [x] T024 [US3] Add permission tree selection UI in web/src/pages/System/Role/index.tsx
- [x] T025 [US3] Update current-user permission loading to use role bindings in server/admin-service/internal/data/auth.go

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T026 Run `go test ./...` from server/admin-service
- [x] T027 Run `go build -o ./bin/ ./cmd/admin-service` from server/admin-service
- [x] T028 Run `npm run lint` from web
- [x] T029 Run `npm run test` from web
- [x] T030 Run `npm run build` from web
- [x] T031 Update specs/001-min-login-integration notes if current-user behavior changed

## Dependencies & Execution Order

- Feature 003 and 004 are prerequisites.
- US1 is MVP; US2 depends on US1; US3 depends on menu tree and role mutation.

## Parallel Opportunities

- Role backend list implementation and frontend service wrapper can run in
  parallel after protobuf generation.

## Implementation Strategy

Deliver read-only roles, then role mutation, then permission binding.
