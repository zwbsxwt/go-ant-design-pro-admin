# Feature Specification: Dynamic Menu Linkage

**Feature Branch**: `007-dynamic-menu-linkage`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "菜单名称改为中文，角色里 admin 关联所有菜单；菜单数据和实际菜单以及页面做真实联动。"

## User Scenarios & Testing

### User Story 1 - Chinese Built-In Menus (Priority: P1)

An administrator sees built-in menu resources and the left navigation in Chinese.

**Independent Test**: Sign in as admin and confirm the left navigation and Menu Management rows use Chinese built-in names.

**Acceptance Scenarios**:

1. **Given** seeded menus exist, **When** admin opens Menu Management, **Then** built-in menu and button names are Chinese.
2. **Given** admin signs in, **When** the left navigation renders, **Then** it shows `欢迎`, `管理页`, and `系统管理`.

### User Story 2 - Database-Driven Menu Visibility (Priority: P1)

Authorized menus from the database drive the left navigation display.

**Independent Test**: Sign in as admin and user, then confirm the left navigation follows database-backed permissions.

**Acceptance Scenarios**:

1. **Given** admin has all built-in menu permissions, **When** currentUser loads, **Then** the returned menu tree includes all enabled directory/page menus.
2. **Given** normal user only has dashboard permission, **When** currentUser loads, **Then** the returned menu tree excludes system management.

### User Story 3 - Safe Component Linkage (Priority: P2)

Database menus only render when their page component exists in the frontend route whitelist.

**Independent Test**: A database menu with an unknown component does not appear in the left navigation.

**Acceptance Scenarios**:

1. **Given** a database page menu references an unknown component, **When** the left navigation renders, **Then** that page menu is ignored.
2. **Given** a database page menu references a known component and is enabled, **When** the user has permission, **Then** that menu appears and navigates to the real page.

## Requirements

### Functional Requirements

- **FR-001**: Built-in menu and button resource names MUST be seeded in Chinese.
- **FR-002**: Permission codes MUST remain unchanged and stable.
- **FR-003**: `GET /api/currentUser` MUST return an authorized menu tree.
- **FR-004**: The authorized menu tree MUST include only `directory` and `page` resources.
- **FR-005**: The authorized menu tree MUST exclude disabled menus and menus granted only through disabled roles.
- **FR-006**: The frontend left navigation MUST use currentUser menu data for name, order, status, and visibility.
- **FR-007**: The frontend MUST only render database menus that map to existing static route/component whitelist entries.
- **FR-008**: Page access permission checks MUST continue using `menu_permissions`.
- **FR-009**: Button permission checks MUST continue using `button_permissions`.
- **FR-010**: Higress MUST remain routing-only for this feature.

### Module Scope

- **In Scope**: `server`, `web`, `specs`, seed data, currentUser contract.
- **Out of Scope**: runtime dynamic component loading, Higress auth, multi-language menu fields, MCP, Prometheus, Grafana.

## Success Criteria

- **SC-001**: Admin sees Chinese built-in menus in left navigation and Menu Management.
- **SC-002**: Normal user does not see system management menus.
- **SC-003**: Editing database menu name/order/status affects left navigation after currentUser refresh.
- **SC-004**: Unknown database page components do not render in left navigation.
- **SC-005**: Backend and frontend validation commands pass.

## Assumptions

- Database-driven linkage means controlling menu labels, sort order, status, and authorization visibility.
- Static frontend routes remain the page/component whitelist.
- Permission codes stay English and stable.
