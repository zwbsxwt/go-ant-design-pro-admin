# Feature Specification: System Role Management

**Feature Branch**: `005-system-role-management`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "实现角色管理 CRUD，角色编码唯一，角色绑定菜单权限和按钮权限。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Roles (Priority: P1)

An administrator can open System Management / Role Management and view existing
roles, including `admin` and `user`, with status and descriptions.

**Why this priority**: Role visibility is required before permissions can be
managed safely.

**Independent Test**: Sign in as admin, open Role Management, and confirm seeded
roles appear.

**Acceptance Scenarios**:

1. **Given** seeded roles exist, **When** an admin opens Role Management,
   **Then** roles are listed with code, name, description, and status.
2. **Given** a normal user lacks role-management permission, **When** they sign
   in, **Then** Role Management is hidden or access is denied.

---

### User Story 2 - Maintain Roles (Priority: P2)

An administrator can create, update, enable/disable, and safely delete roles.

**Why this priority**: Templates need editable roles instead of hard-coded role
names.

**Independent Test**: Create a role with a unique code, edit it, disable it, and
delete it when no users are bound.

**Acceptance Scenarios**:

1. **Given** an admin submits a role with a unique code, **When** they save,
   **Then** the role is created.
2. **Given** a role is disabled, **When** permissions are evaluated, **Then** the
   role grants no active access.
3. **Given** a role has user bindings, **When** deletion is attempted, **Then**
   the operation is blocked or requires a documented safe path.

---

### User Story 3 - Bind Role Permissions (Priority: P3)

An administrator can assign menu and button permission nodes to a role.

**Why this priority**: Role-based permission control is the bridge between menu
management and user access.

**Independent Test**: Change a role's menu/button permissions, sign in as a user
with that role, and confirm visible menus and buttons match.

**Acceptance Scenarios**:

1. **Given** an admin updates a role's permissions, **When** the role is saved,
   **Then** the selected menu and button nodes are bound to that role.
2. **Given** a user has the changed role, **When** current-user permissions are
   loaded, **Then** menu and button permission codes reflect the new bindings.

### Edge Cases

- Role codes are unique and stable.
- Built-in roles may be protected from unsafe deletion.
- Disabled roles do not grant permissions.
- Deleted or disabled menu nodes cannot be granted as active permissions.
- Unauthorized users cannot call role management APIs directly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide Role Management under System Management
  for authorized administrators.
- **FR-002**: The system MUST list roles with code, name, description, and
  status.
- **FR-003**: Role code MUST be unique.
- **FR-004**: Authorized administrators MUST be able to create roles.
- **FR-005**: Authorized administrators MUST be able to update role names,
  descriptions, and status.
- **FR-006**: Authorized administrators MUST be able to delete roles only when
  safety rules allow it.
- **FR-007**: Authorized administrators MUST be able to bind roles to menu and
  button permission nodes.
- **FR-008**: Current-user permissions MUST use database roles rather than
  hard-coded `admin` or `user` checks.
- **FR-009**: Unauthorized users MUST NOT be able to manage roles.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server`, `web`, `docs`, `specs`.
- **Out of Scope**: `gateway` auth, `mcp`, `prometheus`, `grafana`, user CRUD.
- **Optional Runtime Impact**: Observability and MCP remain optional.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **Role**: Permission group with unique code, name, description, and status.
- **Role Permission Binding**: Role-to-menu/button relationship.
- **Permission Selection Tree**: The menu tree presented for role assignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authorized admin can create and update a role within 2 minutes.
- **SC-002**: Duplicate role codes are rejected 100% of the time.
- **SC-003**: Changing a role's permissions changes current-user menu/button
  payloads after the next permission refresh.
- **SC-004**: Unauthorized users cannot access role management through UI or API.

## Assumptions

- Feature 003 provides persistence.
- Feature 004 provides menu and button permission nodes.
- Role permissions affect frontend visibility and backend authorization checks.
