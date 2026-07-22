# Tasks: Admin Branding And Login UI

**Input**: Design documents from `/specs/002-admin-branding-login-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused verification is included; strict TDD is not required.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current branding locations and governing frontend docs.

- [x] T001 Review branding contract in specs/002-admin-branding-login-ui/contracts/frontend-branding-contract.md
- [x] T002 Review frontend conventions in docs/frontend/ant-design-pro-conventions.md
- [x] T003 Review Ant Design design language in docs/frontend/design.md
- [x] T004 Search current frontend product labels with `rg "Ant Design Pro" web`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish canonical branding constants and avoid accidental framework rename.

- [x] T005 Update product title settings in web/config/defaultSettings.ts
- [x] T006 Update application metadata title in web/config/config.ts
- [x] T007 Update manifest app names in web/src/manifest.json

**Checkpoint**: Product metadata is aligned before page copy changes.

---

## Phase 3: User Story 1 - See Consistent Product Name (Priority: P1) MVP

**Goal**: Running app surfaces show `go-ant-design-pro-admin`.

**Independent Test**: Open login and starter pages and inspect browser title,
manifest metadata, footer, and visible page text.

### Implementation for User Story 1

- [x] T008 [US1] Update login brand copy in web/src/pages/user/login/index.tsx
- [x] T009 [US1] Update footer product text in web/src/components/Footer/index.tsx
- [x] T010 [US1] Update Welcome starter copy in web/src/pages/Welcome.tsx
- [x] T011 [US1] Update Admin starter copy in web/src/pages/Admin.tsx
- [x] T012 [US1] Run browser smoke verification from specs/002-admin-branding-login-ui/quickstart.md

---

## Phase 4: User Story 2 - Keep Ant Design References Clear (Priority: P2)

**Goal**: Framework documentation references remain meaningful while product text is local.

**Independent Test**: Search source and confirm remaining "Ant Design Pro"
occurrences are framework references.

### Implementation for User Story 2

- [x] T013 [US2] Review remaining frontend occurrences in web/ for product-branding leaks
- [x] T014 [US2] Update locale or snapshot product labels in web/src where visible labels changed
- [x] T015 [US2] Document any intentional framework references in specs/002-admin-branding-login-ui/research.md

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T016 Run `npm run lint` from web
- [x] T017 Run `npm run test` from web
- [x] T018 Run `npm run build` from web
- [x] T019 Update specs/000-bootstrap/research.md only if frontend run commands or ports changed

## Dependencies & Execution Order

- Phase 1 before all changes.
- Phase 2 before page copy changes.
- US1 can deliver the MVP.
- US2 follows US1 to clean up ambiguous references.

## Parallel Opportunities

- T005, T006, and T007 can run in parallel.
- T008, T009, T010, and T011 can run in parallel after metadata changes.

## Implementation Strategy

Complete metadata first, then user-visible pages, then search and verify.
