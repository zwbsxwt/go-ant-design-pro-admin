# Tasks: Minimum Login Integration

**Input**: Design documents from `/specs/001-min-login-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused verification is included in each phase. This feature does not
require strict test-first/TDD sequencing.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Tasks use real repository paths and state the touched module

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare contracts, generated API shape, and integration scaffolding.

- [x] T001 Review auth API contract in specs/001-min-login-integration/contracts/auth-api.yaml
- [x] T002 Review frontend auth contract in specs/001-min-login-integration/contracts/frontend-auth-contract.md
- [x] T003 Review gateway route contract in specs/001-min-login-integration/contracts/gateway-routes.md
- [x] T004 Create Kratos auth API directory server/admin-service/api/auth/v1
- [x] T005 Create frontend auth service directory web/src/services/admin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared auth contract, backend layers, frontend auth-state plumbing, and verification baseline.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Define auth protobuf service and messages in server/admin-service/api/auth/v1/auth.proto
- [x] T007 Define auth error reasons in server/admin-service/api/auth/v1/error_reason.proto
- [x] T008 Regenerate Kratos API bindings from server/admin-service/api/auth/v1/auth.proto
- [x] T009 [P] Add auth entity and repository interface in server/admin-service/internal/biz/auth.go
- [x] T010 [P] Add seeded user repository implementation in server/admin-service/internal/data/auth.go
- [x] T011 Add auth usecase constructor and provider wiring in server/admin-service/internal/biz/biz.go
- [x] T012 Add data provider wiring for auth repository in server/admin-service/internal/data/data.go
- [x] T013 Add auth service constructor and provider wiring in server/admin-service/internal/service/service.go
- [x] T014 Regenerate Wire dependency injection in server/admin-service/cmd/admin-service/wire_gen.go
- [x] T015 [P] Add browser auth-state helper in web/src/utils/authState.ts
- [x] T016 [P] Add admin auth service wrapper in web/src/services/admin/auth.ts
- [x] T017 Update frontend API typings for token and menu permissions in web/src/services/ant-design-pro/typings.d.ts

**Checkpoint**: Backend auth API can compile conceptually, frontend has a planned auth-state surface, and all user stories can build on the same contract.

---

## Phase 3: User Story 1 - Sign In To Admin Console (Priority: P1) MVP

**Goal**: A seeded administrator can sign in from Ant Design Pro and reach the authenticated workspace.

**Independent Test**: Start backend and frontend, submit valid administrator credentials on `/user/login`, and confirm the authenticated workspace appears.

### Implementation for User Story 1

- [x] T018 [US1] Implement Login usecase behavior in server/admin-service/internal/biz/auth.go
- [x] T019 [US1] Implement seeded admin credential verification in server/admin-service/internal/data/auth.go
- [x] T020 [US1] Implement Login transport method in server/admin-service/internal/service/auth.go
- [x] T021 [US1] Register AuthService HTTP endpoint in server/admin-service/internal/server/http.go
- [x] T022 [US1] Register AuthService gRPC endpoint in server/admin-service/internal/server/grpc.go
- [x] T023 [US1] Attach token persistence after successful login in web/src/pages/user/login/index.tsx
- [x] T024 [US1] Attach Authorization request interceptor in web/src/requestErrorConfig.ts
- [x] T025 [US1] Update login service call path or wrapper usage in web/src/services/ant-design-pro/api.ts
- [x] T026 [US1] Verify administrator login manually using specs/001-min-login-integration/quickstart.md

**Checkpoint**: User Story 1 works independently. Invalid credentials stay on login; valid admin reaches the workspace.

---

## Phase 4: User Story 2 - Load Current User And Menu Permissions (Priority: P2)

**Goal**: Signed-in users load current user and see menu entries according to backend-provided permission state.

**Independent Test**: Sign in as seeded admin and seeded non-admin, refresh the workspace, and confirm menu visibility differs correctly.

### Implementation for User Story 2

- [x] T027 [US2] Implement CurrentUser usecase behavior in server/admin-service/internal/biz/auth.go
- [x] T028 [US2] Implement token lookup and disabled-user checks in server/admin-service/internal/data/auth.go
- [x] T029 [US2] Implement CurrentUser transport method in server/admin-service/internal/service/auth.go
- [x] T030 [US2] Map backend current user payload to Ant Design Pro CurrentUser shape in web/src/services/admin/auth.ts
- [x] T031 [US2] Update getInitialState current-user loading in web/src/app.tsx
- [x] T032 [US2] Update access rules for admin and non-admin users in web/src/access.ts
- [x] T033 [US2] Add 401 auth-state clearing and login redirect behavior in web/src/requestErrorConfig.ts
- [x] T034 [US2] Verify seeded admin and non-admin menu visibility using specs/001-min-login-integration/quickstart.md

**Checkpoint**: Current user comes from Kratos, page refresh keeps valid access, and non-admin users cannot see admin-only menus.

---

## Phase 5: User Story 3 - Route Through The Gateway (Priority: P3)

**Goal**: The same login/current-user flow works through the Higress gateway entry without direct frontend/backend ports.

**Independent Test**: Open the gateway HTTP entry, sign in, refresh, and confirm current-user requests work through the gateway.

### Implementation for User Story 3

- [x] T035 [US3] Document local Higress frontend route setup in gateway/README.md
- [x] T036 [US3] Document local Higress /api route setup in gateway/README.md
- [x] T037 [US3] Add deploy note for integrated auth gateway flow in deploy/auth-gateway.local.md
- [x] T038 [US3] Configure or document preserving Authorization for /api traffic in gateway/README.md
- [x] T039 [US3] Verify integrated gateway flow using specs/001-min-login-integration/quickstart.md

**Checkpoint**: Gateway entry loads the admin console and routes auth/current-user traffic to Kratos.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Keep docs, generated artifacts, and checks aligned.

- [x] T040 [P] Update feature quickstart with final seeded credentials in specs/001-min-login-integration/quickstart.md
- [x] T041 [P] Update bootstrap runtime notes if ports or startup commands changed in specs/000-bootstrap/research.md
- [x] T042 Run backend verification commands from server/admin-service
- [x] T043 Run frontend verification commands with mock disabled from web
- [x] T044 Run integrated gateway verification from specs/001-min-login-integration/quickstart.md
- [x] T045 Review Git status and ensure generated/runtime artifacts remain ignored in .gitignore

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **US1 Sign In (Phase 3)**: Depends on Phase 2.
- **US2 Current User & Permissions (Phase 4)**: Depends on US1 token/auth state.
- **US3 Gateway Routing (Phase 5)**: Depends on US1 and US2 working through direct module ports.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1**: MVP. Can be validated with backend and frontend direct ports.
- **US2**: Builds on US1 authenticated state, but is independently verifiable by comparing admin and non-admin sessions.
- **US3**: Builds on US1 and US2, then proves the same behavior through Higress.

### Parallel Opportunities

- T009 and T010 can run in parallel after protobuf contract definition.
- T015, T016, and T017 can run in parallel with backend foundational work.
- T035, T036, T037, and T038 can run in parallel once the direct-port flow works.
- T040 and T041 can run in parallel during polish.

---

## Parallel Example: Foundational Work

```text
Task: "Add auth entity and repository interface in server/admin-service/internal/biz/auth.go"
Task: "Add seeded user repository implementation in server/admin-service/internal/data/auth.go"
Task: "Add browser auth-state helper in web/src/utils/authState.ts"
Task: "Add admin auth service wrapper in web/src/services/admin/auth.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 only.
3. Validate administrator login on direct frontend/backend ports.
4. Commit the MVP if stable.

### Incremental Delivery

1. Add US2 current-user and menu permission behavior.
2. Validate admin and non-admin flows independently.
3. Add US3 Higress routing.
4. Validate the integrated gateway flow.

### Stop Conditions

- Stop if protobuf generation or Wire regeneration fails and document the exact tool error.
- Stop if Ant Design Pro mock mode masks backend auth behavior.
- Stop if Higress cannot route `/api/*` while preserving `Authorization`.

---

## Notes

- Every task preserves UTF-8.
- Frontend tasks follow `docs/frontend/ant-design-pro-conventions.md`.
- Backend tasks follow `docs/backend/kratos-conventions.md`.
- Button-level permissions, persistent user management, password change, API keys,
  MCP, Prometheus, and Grafana are intentionally outside this feature.
