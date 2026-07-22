# Tasks: System Data Foundation

**Input**: Design documents from `/specs/003-system-data-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused backend and Docker verification is required.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Review data dependency contract in specs/003-system-data-foundation/contracts/local-data-dependencies.md
- [x] T002 Review backend conventions in docs/backend/kratos-conventions.md
- [x] T003 Inspect current config in server/admin-service/configs/config.yaml
- [x] T004 Inspect current data providers in server/admin-service/internal/data/data.go

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Add local MySQL and Redis services in deploy/docker-compose.local.yml
- [x] T006 Add local dependency startup docs in deploy/README.md
- [x] T007 Update backend config defaults for database name in server/admin-service/configs/config.yaml
- [x] T008 Define migration and seed file location under server/admin-service/internal/data/
- [x] T009 Update specs/000-bootstrap/research.md with MySQL/Redis ports and 8G Docker memory assumption

**Checkpoint**: Local dependency runtime is documented before backend storage wiring.

---

## Phase 3: User Story 1 - Start Local Data Dependencies (Priority: P1) MVP

**Goal**: Developers can start and verify MySQL and Redis without observability.

**Independent Test**: Run the documented compose command and connect to both services.

- [x] T010 [US1] Implement MySQL container healthcheck in deploy/docker-compose.local.yml
- [x] T011 [US1] Implement Redis container healthcheck in deploy/docker-compose.local.yml
- [x] T012 [US1] Document MySQL connection verification in specs/003-system-data-foundation/quickstart.md
- [x] T013 [US1] Document Redis connection verification in specs/003-system-data-foundation/quickstart.md
- [x] T014 [US1] Verify default startup excludes prometheus/ and grafana/ services

---

## Phase 4: User Story 2 - Use Seeded Admin Data From Storage (Priority: P2)

**Goal**: Seeded login users and initial RBAC data come from MySQL.

**Independent Test**: Initialize data twice, restart backend, and sign in with both seeded accounts.

- [x] T015 [P] [US2] Define RBAC migration schema in server/admin-service/internal/data/migrations/
- [x] T016 [P] [US2] Define idempotent seed data in server/admin-service/internal/data/seeds/
- [x] T017 [US2] Initialize MySQL client in server/admin-service/internal/data/data.go
- [x] T018 [US2] Replace in-memory auth repository with storage-backed repository in server/admin-service/internal/data/auth.go
- [x] T019 [US2] Keep auth usecase contract stable in server/admin-service/internal/biz/auth.go
- [x] T020 [US2] Add backend tests for seed idempotency and login lookup under server/admin-service/internal/data/

---

## Phase 5: User Story 3 - Cache Permission Or Session State Safely (Priority: P3)

**Goal**: Redis is usable for derived state without becoming authority.

**Independent Test**: Clear Redis and confirm login/current-user state can be rebuilt from MySQL.

- [x] T021 [US3] Initialize Redis client in server/admin-service/internal/data/data.go
- [x] T022 [US3] Define cache key conventions in server/admin-service/internal/data/
- [x] T023 [US3] Add cache miss fallback behavior in server/admin-service/internal/data/auth.go
- [x] T024 [US3] Document Redis restart/cache miss behavior in specs/003-system-data-foundation/quickstart.md

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T025 Run `go test ./...` from server/admin-service
- [x] T026 Run `go build -o ./bin/ ./cmd/admin-service` from server/admin-service
- [x] T027 Run Docker dependency verification from specs/003-system-data-foundation/quickstart.md
- [x] T028 Review .gitignore keeps runtime data, logs, bins, and secrets out of Git

## Dependencies & Execution Order

- Phase 1 before edits.
- Phase 2 blocks all user stories.
- US1 delivers Docker startup MVP.
- US2 depends on US1 running MySQL.
- US3 depends on Redis from US1 and storage truth from US2.

## Parallel Opportunities

- T015 and T016 can run in parallel.
- T020 can be prepared while repository wiring is implemented.

## Implementation Strategy

Start with Docker and docs, then durable seed data, then Redis cache behavior.
