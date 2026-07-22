# Feature Specification: System User Management

**Feature Branch**: `006-system-user-management`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "实现用户管理 CRUD，启用/禁用、重置密码、绑定角色；登录和 currentUser 从数据库读取用户、角色、菜单、按钮权限。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Users (Priority: P1)

An administrator can open System Management / User Management and view users
with account status and assigned roles.

**Why this priority**: User visibility is the baseline for all account
operations.

**Independent Test**: Sign in as admin, open User Management, and confirm seeded
users appear with roles and status.

**Acceptance Scenarios**:

1. **Given** seeded users exist, **When** an admin opens User Management, **Then**
   users are listed with username, display name, status, and role summary.
2. **Given** a normal user lacks user-management permission, **When** they sign
   in, **Then** User Management is hidden or access is denied.

---

### User Story 2 - Maintain User Accounts (Priority: P2)

An administrator can create, update, enable/disable, and reset passwords for
users.

**Why this priority**: Account lifecycle is a core admin function.

**Independent Test**: Create a user, edit profile fields, disable the account,
reset password, then verify login behavior matches account status and password.

**Acceptance Scenarios**:

1. **Given** an admin creates a user with valid required fields, **When** they
   save, **Then** the user can appear in the list.
2. **Given** a user is disabled, **When** that user attempts login, **Then**
   access is rejected.
3. **Given** a password is reset, **When** the user signs in with the reset
   password, **Then** sign-in succeeds if the account is enabled.

---

### User Story 3 - Bind User Roles And Resolve Permissions (Priority: P3)

An administrator can bind roles to users, and login/current-user responses use
those roles to produce role, menu, and button permission codes.

**Why this priority**: This completes the basic RBAC loop across users, roles,
menus, and frontend permissions.

**Independent Test**: Bind a role to a user, sign in as that user, and confirm
menu and button visibility follows the assigned roles.

**Acceptance Scenarios**:

1. **Given** an admin changes a user's roles, **When** the user refreshes
   current-user state, **Then** the role codes and permissions reflect the
   change.
2. **Given** a user has multiple roles, **When** permissions are resolved, **Then**
   the user receives the union of active enabled role permissions.

### Edge Cases

- Username is unique.
- Disabled users cannot sign in or keep active sessions after refresh.
- Password resets must not expose stored credential hashes.
- A user with no roles has no protected menu or button permissions.
- Built-in seed admin must not be accidentally locked out without a recovery
  path documented by implementation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide User Management under System Management
  for authorized administrators.
- **FR-002**: The system MUST list users with username, display name, status,
  and role summary.
- **FR-003**: Username MUST be unique.
- **FR-004**: Authorized administrators MUST be able to create users.
- **FR-005**: Authorized administrators MUST be able to update user profile and
  status fields.
- **FR-006**: Authorized administrators MUST be able to reset user passwords.
- **FR-007**: Authorized administrators MUST be able to bind users to roles.
- **FR-008**: Login MUST read user status and credentials from durable storage.
- **FR-009**: `GET /api/currentUser` MUST return user profile, role codes, menu
  permission codes, and button permission codes.
- **FR-010**: Disabled users MUST be rejected during login and current-user
  refresh.
- **FR-011**: Unauthorized users MUST NOT be able to manage users.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server`, `web`, `docs`, `specs`.
- **Out of Scope**: `gateway` auth, `mcp`, `prometheus`, `grafana`, audit logs,
  self-service password change, SSO, JWT gateway enforcement.
- **Optional Runtime Impact**: Observability and MCP remain optional.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **User**: Login identity and managed account.
- **User Role Binding**: Relationship granting roles to a user.
- **Resolved Permission Set**: Derived role, menu, and button permission codes
  returned to the frontend.
- **Password Reset**: Admin-triggered credential change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authorized admin can create, update, disable, and reset a user
  password within 3 minutes.
- **SC-002**: Disabled users are rejected from login and current-user refresh
  100% of the time.
- **SC-003**: A user's role changes are reflected in current-user permissions
  after the next refresh.
- **SC-004**: Unauthorized users cannot access user management through UI or API.
- **SC-005**: Admin and normal user accounts demonstrate different menu and
  button permissions through the integrated frontend.

## Assumptions

- Features 003, 004, and 005 are implemented first.
- Kratos remains responsible for auth and permission checks in this batch.
- Password policy is simple for the template baseline and can be hardened later.
