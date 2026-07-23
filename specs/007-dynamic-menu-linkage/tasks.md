# Tasks: Dynamic Menu Linkage

**Input**: Design documents from `/specs/007-dynamic-menu-linkage/`

## Phase 1: Setup

- [x] T001 Create Spec Kit artifacts for 007 dynamic menu linkage
- [x] T002 Update SDD Chinese workspace index with 007

## Phase 2: Backend Contract And Data

- [x] T003 Extend auth protobuf currentUser with CurrentUserMenu tree
- [x] T004 Regenerate auth API bindings and OpenAPI output
- [x] T005 Add AuthUser menu tree model and conversion
- [x] T006 Query authorized directory/page menu tree from database
- [x] T007 Chinese-localize built-in menu and button seed names

## Phase 3: Frontend Linkage

- [x] T008 Extend frontend currentUser typings and normalization for menus
- [x] T009 Add stable permissionCode metadata to static routes
- [x] T010 Render left navigation from currentUser menu tree and static route whitelist
- [x] T011 Ensure page access remains backed by existing menu permission access checks

## Phase 4: Validation

- [x] T012 Run `go test ./...` from server/admin-service
- [x] T013 Run `go build -o ./bin/ ./cmd/admin-service` from server/admin-service
- [x] T014 Run `npm run lint` from web
- [x] T015 Run `npm run test` from web
- [x] T016 Run `npm run build` from web
- [x] T017 Smoke currentUser menu tree for admin and user
- [x] T018 Smoke frontend left navigation through direct and gateway entries

## Dependencies

- Backend protobuf and currentUser data must be complete before frontend runtime menu linkage.
- Seed names can be localized independently, but final smoke depends on a restarted backend.
