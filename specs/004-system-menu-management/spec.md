# Feature Specification: System Menu Management

**Feature Branch**: `004-system-menu-management`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "实现系统管理里的菜单管理 CRUD，菜单支持目录、页面、按钮权限点。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Menu Tree (Priority: P1)

An administrator can open System Management / Menu Management and view the
current directory, page, and button permission tree.

**Why this priority**: Menu management must first make the permission structure
visible before edits are safe.

**Independent Test**: Sign in as admin, open the menu management page, and
confirm the seeded menu tree is displayed with type, permission code, status, and
sort order.

**Acceptance Scenarios**:

1. **Given** seeded menu data exists, **When** an admin opens Menu Management,
   **Then** the menu tree is shown in sorted parent-child order.
2. **Given** a normal user lacks menu-management permission, **When** they sign
   in, **Then** the Menu Management entry is hidden or access is denied.

---

### User Story 2 - Maintain Menu Nodes (Priority: P2)

An administrator can create, update, enable/disable, and delete safe menu nodes.

**Why this priority**: The framework needs editable navigation and permission
resources rather than static route fixtures.

**Independent Test**: Create a page node under a directory, edit its fields,
disable it, then delete it when no protected binding prevents deletion.

**Acceptance Scenarios**:

1. **Given** an admin creates a directory, page, or button node with valid
   fields, **When** they submit, **Then** the node appears in the tree.
2. **Given** an admin edits a node, **When** they save valid changes, **Then**
   later views show the updated values.
3. **Given** a node is disabled, **When** permissions are loaded, **Then** the
   disabled node is not granted as active access.

---

### User Story 3 - Validate Permission Structure (Priority: P3)

An administrator receives clear validation feedback when menu data would create
duplicates, invalid parent relationships, or unsafe deletes.

**Why this priority**: Permission trees are easy to corrupt without guardrails.

**Independent Test**: Try duplicate permission codes, invalid parent/type
combinations, circular parents, and deleting a bound node.

**Acceptance Scenarios**:

1. **Given** a permission code already exists, **When** an admin saves another
   node with that code, **Then** the save is rejected.
2. **Given** deleting a node would remove bound role permissions, **When** an
   admin attempts deletion, **Then** the system blocks or requires a documented
   safe path.

### Edge Cases

- Root nodes have no parent.
- A node cannot be its own ancestor.
- Button nodes do not need route component fields.
- Disabled parents affect active descendants according to the implementation
  plan.
- Permission codes must remain stable for route and button checks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Menu Management page under System
  Management for authorized administrators.
- **FR-002**: The system MUST list menu permission nodes as a parent-child tree.
- **FR-003**: Menu nodes MUST support `directory`, `page`, and `button` types.
- **FR-004**: Menu nodes MUST include name, route path, component identifier,
  permission code, icon, sort order, status, and parent.
- **FR-005**: Authorized administrators MUST be able to create menu nodes.
- **FR-006**: Authorized administrators MUST be able to update menu nodes.
- **FR-007**: Authorized administrators MUST be able to enable or disable menu
  nodes.
- **FR-008**: Authorized administrators MUST be able to delete menu nodes only
  when deletion does not corrupt bindings or descendants.
- **FR-009**: Permission codes MUST be unique.
- **FR-010**: Unauthorized users MUST NOT be able to manage menu nodes.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server`, `web`, `docs`, `specs`.
- **Out of Scope**: `gateway` auth, `mcp`, `prometheus`, `grafana`, role binding
  UI beyond showing binding impact.
- **Optional Runtime Impact**: Observability and MCP remain optional.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **Menu Permission**: A directory, page, or button node.
- **Menu Tree**: The ordered parent-child structure used for routes, visible
  menus, and button permissions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authorized admin can create, edit, disable, and delete an
  unbound menu node within 2 minutes.
- **SC-002**: Duplicate permission codes are rejected 100% of the time.
- **SC-003**: Unauthorized users cannot access menu management through either UI
  navigation or direct backend calls.
- **SC-004**: The menu tree displays 100% of seeded nodes in deterministic sort
  order.

## Assumptions

- Feature `003-system-data-foundation` provides MySQL persistence.
- Existing login/current-user permissions are available for admin checks.
- Higress continues routing `/api/*` only and does not enforce this permission.
