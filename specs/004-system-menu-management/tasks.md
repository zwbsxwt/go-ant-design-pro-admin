# Tasks: System Menu Management

**Input**: Design documents from `/specs/004-system-menu-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Review menu API contract in specs/004-system-menu-management/contracts/menu-api.yaml
- [x] T002 Review backend conventions in docs/backend/kratos-conventions.md
- [x] T003 Review frontend conventions in docs/frontend/ant-design-pro-conventions.md
- [x] T004 Confirm feature 003 storage foundation is available in server/admin-service/internal/data/

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Define menu protobuf API in server/admin-service/api/system/v1/menu.proto
- [x] T006 Define menu error reasons in server/admin-service/api/system/v1/error_reason.proto
- [x] T007 Regenerate Kratos API and OpenAPI bindings under server/admin-service/api/system/v1/
- [x] T008 Add menu route/access constants in web/src/access.ts
- [x] T009 Add System Management route placeholder in web/config/routes.ts

---

## Phase 3: User Story 1 - Browse Menu Tree (Priority: P1) MVP

**Goal**: Admin can view the menu permission tree.

**Independent Test**: Admin opens Menu Management and sees sorted seeded nodes.

- [x] T010 [P] [US1] Add menu entity and repository interface in server/admin-service/internal/biz/menu.go
- [x] T011 [P] [US1] Add menu repository list implementation in server/admin-service/internal/data/menu.go
- [x] T012 [US1] Add menu list usecase in server/admin-service/internal/biz/menu.go
- [x] T013 [US1] Add menu list service method in server/admin-service/internal/service/menu.go
- [x] T014 [US1] Register menu service in server/admin-service/internal/server/http.go
- [x] T015 [P] [US1] Add frontend menu service wrapper in web/src/services/system/menu.ts
- [x] T016 [US1] Add Menu Management tree table page in web/src/pages/System/Menu/index.tsx

---

## Phase 4: User Story 2 - Maintain Menu Nodes (Priority: P2)

**Goal**: Admin can create, update, enable/disable, and delete allowed nodes.

**Independent Test**: Create, edit, disable, and delete an unbound node.

- [x] T017 [US2] Add create/update/delete repository methods in server/admin-service/internal/data/menu.go
- [x] T018 [US2] Add create/update/delete usecase validation in server/admin-service/internal/biz/menu.go
- [x] T019 [US2] Add create/update/delete service methods in server/admin-service/internal/service/menu.go
- [x] T020 [US2] Add create/edit forms and delete confirmation in web/src/pages/System/Menu/index.tsx
- [x] T021 [US2] Add status toggle behavior in web/src/pages/System/Menu/index.tsx

---

## Phase 5: User Story 3 - Validate Permission Structure (Priority: P3)

**Goal**: Invalid tree and permission operations are rejected clearly.

**Independent Test**: Attempt duplicate codes, circular parents, invalid types, and bound deletes.

- [x] T022 [US3] Add duplicate permission code checks in server/admin-service/internal/biz/menu.go
- [x] T023 [US3] Add parent cycle/type validation in server/admin-service/internal/biz/menu.go
- [x] T024 [US3] Add role-binding delete protection in server/admin-service/internal/biz/menu.go
- [x] T025 [US3] Show validation messages in web/src/pages/System/Menu/index.tsx

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T026 Run `go test ./...` from server/admin-service
- [x] T027 Run `go build -o ./bin/ ./cmd/admin-service` from server/admin-service
- [x] T028 Run `npm run lint` from web
- [x] T029 Run `npm run test` from web
- [x] T030 Run `npm run build` from web
- [x] T031 Update docs if routes, ports, or startup commands changed

## Dependencies & Execution Order

- Feature 003 is a prerequisite.
- Phase 2 blocks all stories.
- US1 is MVP; US2 depends on US1 list behavior; US3 hardens US2 writes.

## Parallel Opportunities

- Backend entity/repository and frontend service wrapper can start in parallel
  after protobuf contract generation.

## Implementation Strategy

Deliver read-only tree first, then mutation, then safety validation.
