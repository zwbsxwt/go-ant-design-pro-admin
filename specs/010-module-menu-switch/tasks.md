# Tasks: 模块切换与菜单分组

**Input**: `specs/010-module-menu-switch/`

## Phase 1: Setup

- [x] T001 Create `plan.md`, `research.md`, `data-model.md`, `contracts/module-menu-api.md`, `quickstart.md`, and `tasks.md` in `specs/010-module-menu-switch`
- [x] T002 Update `.specify/feature.json` to point to `specs/010-module-menu-switch`

## Phase 2: Backend Foundation

- [x] T003 Add module protobuf API in `server/admin-service/api/system/v1/module.proto`
- [x] T004 Extend menu and currentUser protobuf contracts in `server/admin-service/api/system/v1/menu.proto` and `server/admin-service/api/auth/v1/auth.proto`
- [x] T005 Regenerate protobuf, HTTP, gRPC, and OpenAPI code from `server/admin-service`
- [x] T006 Add module schema migration and seed data in `server/admin-service/internal/data`
- [x] T007 Add module biz/usecase/repo contracts in `server/admin-service/internal/biz/module.go`
- [x] T008 Add module data repository in `server/admin-service/internal/data/module.go`
- [x] T009 Register module providers and services in Wire, HTTP, and gRPC setup

## Phase 3: User Story 1 - 切换当前业务模块

- [x] T010 [US1] Return authorized modules from currentUser in `server/admin-service/internal/data/auth.go`
- [x] T011 [US1] Add frontend module switch component in `web/src/components/RightContent/ModuleSwitch.tsx`
- [x] T012 [US1] Render module switch from `web/src/app.tsx`
- [x] T013 [US1] Persist selected module locally and fall back safely in `web/src/app.tsx`

## Phase 4: User Story 2 - 模块与菜单真实联动

- [x] T014 [US2] Extend backend menu model/repository/service with `module_id`
- [x] T015 [US2] Filter left navigation by selected module in `web/src/app.tsx`
- [x] T016 [US2] Add module selector to menu management page in `web/src/pages/System/Menu/index.tsx`
- [x] T017 [US2] Extend frontend menu service/types with `moduleId`

## Phase 5: User Story 3 - 管理模块基础信息

- [x] T018 [US3] Implement module CRUD backend service
- [x] T019 [US3] Add module frontend service in `web/src/services/system/module.ts`
- [x] T020 [US3] Add module management route and page in `web/config/routes.ts` and `web/src/pages/System/Module/index.tsx`
- [x] T021 [US3] Add seed menu and admin role binding for module management

## Phase 6: Validation

- [x] T022 Run `go test ./...` from `server/admin-service`
- [x] T023 Run `go build -o ./bin/ ./cmd/admin-service` from `server/admin-service`
- [x] T024 Run `npm run lint` from `web`
- [x] T025 Run `npm run test` from `web`
- [x] T026 Run `npm run build` from `web`
- [x] T027 Smoke admin currentUser modules and menu filtering
- [x] T028 Update `specs/010-module-menu-switch/tasks.md` and `specs/README.zh-CN.md` status after validation
