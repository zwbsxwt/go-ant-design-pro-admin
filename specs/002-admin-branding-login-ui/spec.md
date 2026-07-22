# Feature Specification: Admin Branding And Login UI

**Feature Branch**: `002-admin-branding-login-ui`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "将后台管理里的名称改为 go-ant-design-pro-admin，并规划登录界面修改。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Consistent Product Name (Priority: P1)

As a developer or evaluator opening the admin console, I see the framework name
`go-ant-design-pro-admin` consistently in the browser, login experience, layout
footer, and starter pages.

**Why this priority**: The template needs a clear identity before deeper system
management work begins.

**Independent Test**: Start the frontend, open the login page and authenticated
starter pages, and confirm visible product text uses `go-ant-design-pro-admin`.

**Acceptance Scenarios**:

1. **Given** the admin console is open, **When** the browser tab, manifest, and
   layout are inspected, **Then** the product name is `go-ant-design-pro-admin`.
2. **Given** a user opens the login page, **When** the page renders, **Then** the
   login title and brand copy show `go-ant-design-pro-admin`.
3. **Given** a signed-in user opens the starter pages, **When** Welcome or Admin
   placeholders are shown, **Then** they no longer present the upstream demo
   product as this template's product name.

---

### User Story 2 - Keep Ant Design References Clear (Priority: P2)

As a future maintainer, I can still tell when documentation is referencing Ant
Design Pro as the upstream UI framework rather than the local product brand.

**Why this priority**: The project should not erase important upstream
conventions while renaming the template product.

**Independent Test**: Search user-facing UI text and documentation references to
confirm product branding and framework references are separated.

**Acceptance Scenarios**:

1. **Given** a file documents frontend conventions, **When** it refers to Ant
   Design Pro, **Then** the reference is clearly about the framework.
2. **Given** the running application is inspected, **When** user-facing product
   labels appear, **Then** they use the local product name.

### Edge Cases

- Upstream package names, dependency names, and official framework documentation
  may still contain "Ant Design Pro".
- Locale files and snapshots should not preserve stale user-facing product
  labels after the rename.
- All modified text containing Chinese or product names must remain UTF-8.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The admin console MUST use `go-ant-design-pro-admin` as its
  product name in page title settings.
- **FR-002**: The web app manifest MUST use `go-ant-design-pro-admin` for the
  application name and short name.
- **FR-003**: The login page MUST present `go-ant-design-pro-admin` as the admin
  product identity.
- **FR-004**: The global footer MUST not imply the product is the upstream demo
  app.
- **FR-005**: Starter Welcome and Admin placeholder pages MUST use local template
  language rather than upstream demo branding.
- **FR-006**: Framework documentation references MAY keep "Ant Design Pro" when
  the text clearly refers to the upstream framework.
- **FR-007**: The feature MUST preserve Ant Design Pro simple mode and avoid
  reintroducing demo pages.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `web`, `docs`, `specs`.
- **Out of Scope**: `gateway`, `server`, `mcp`, `prometheus`, `grafana`,
  `deploy`, authentication behavior, data persistence, permission logic.
- **Optional Runtime Impact**: MCP, Prometheus, and Grafana remain optional and
  are not required.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A case-sensitive search of user-facing web source leaves zero
  unintended product labels that still call the local app `Ant Design Pro`.
- **SC-002**: The login page, browser title, and starter page labels can be
  verified in under 3 minutes on a local development machine.
- **SC-003**: The rename can be completed without changing backend, gateway, or
  optional observability runtime behavior.

## Assumptions

- `go-ant-design-pro-admin` is the canonical product name for all local
  user-facing branding.
- Ant Design Pro remains the upstream frontend framework name in technical docs.
- This feature is visual/content-only and does not alter login semantics.
