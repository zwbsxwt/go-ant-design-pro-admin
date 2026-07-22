# Feature Specification: Minimum Login Integration

**Feature Branch**: `001-min-login-integration`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "最小登录整合闭环：Ant Design Pro 登录 -> Kratos 当前用户/权限接口 -> Higress 路由转发。参考 D:\openclaw_workspace\template_v5 过去实现经验。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In To Admin Console (Priority: P1)

An administrator can open the admin console, enter valid credentials, and reach
the authenticated admin workspace.

**Why this priority**: The framework cannot demonstrate a real integrated admin
flow until a user can enter the system through the login screen.

**Independent Test**: Start the frontend, backend, and gateway, open the admin
console from the gateway entry, sign in with the seeded administrator account,
and confirm the authenticated workspace is shown.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the login page, **When** they submit
   valid administrator credentials, **Then** they are signed in and redirected to
   the authenticated admin workspace.
2. **Given** an unauthenticated visitor on the login page, **When** they submit
   invalid credentials, **Then** they remain on the login page and see a clear
   failure message without entering the workspace.
3. **Given** an unauthenticated visitor opens a protected admin page directly,
   **When** the page checks authentication, **Then** the visitor is sent to the
   login page.

---

### User Story 2 - Load Current User And Menu Permissions (Priority: P2)

After sign-in, the admin console loads the current user profile and displays only
the menu entries allowed for that user.

**Why this priority**: The first real integration must prove that identity and
permission state comes from the backend rather than staying as frontend-only mock
data.

**Independent Test**: Sign in as a seeded administrator and confirm the current
user identity is visible in the console, then confirm administrator-only menu
entries appear. Sign in as a seeded non-administrator account and confirm
administrator-only menu entries do not appear.

**Acceptance Scenarios**:

1. **Given** a signed-in administrator, **When** the admin workspace loads,
   **Then** the user name and administrator menu entries are visible.
2. **Given** a signed-in non-administrator, **When** the admin workspace loads,
   **Then** administrator-only menu entries are hidden and normal menu entries
   remain available.
3. **Given** a signed-in user whose account is disabled after sign-in, **When**
   the workspace refreshes current user state, **Then** the user is returned to
   the login page with a clear session-invalid message.

---

### User Story 3 - Route Through The Gateway (Priority: P3)

The admin console can be used through the gateway entry, and frontend-to-backend
traffic is routed consistently without users needing to know internal service
ports.

**Why this priority**: Higress is part of the framework boundary. The first
integration loop should prove that users can enter through the gateway rather
than only through independent development ports.

**Independent Test**: Open the gateway entry, complete sign-in, refresh the page,
and confirm current user and menu permission requests still work through the same
entry.

**Acceptance Scenarios**:

1. **Given** the gateway is running, **When** a visitor opens the admin console
   through the gateway entry, **Then** the login page loads successfully.
2. **Given** a signed-in user using the gateway entry, **When** the console loads
   current user and menu permissions, **Then** those requests reach the backend
   successfully through the gateway.
3. **Given** backend access fails while the console is open, **When** the user
   performs an authenticated action, **Then** the console shows a clear service
   unavailable state instead of silently staying stale.

---

### Edge Cases

- An expired or invalid sign-in state returns the user to the login page and
  clears local authenticated state.
- A disabled account cannot sign in, and an already signed-in disabled user loses
  access on the next current-user refresh.
- A user without administrator permission cannot see administrator-only menus.
- Refreshing a protected page preserves access for a valid signed-in user.
- Gateway or backend unavailability produces a clear user-facing failure state.
- Browser storage corruption does not grant access and does not break the login
  page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a login screen for unauthenticated admin
  users.
- **FR-002**: The system MUST authenticate a user with username and password.
- **FR-003**: The system MUST reject invalid credentials without granting access.
- **FR-004**: The system MUST reject disabled users.
- **FR-005**: The system MUST establish an authenticated state after successful
  login.
- **FR-006**: The system MUST expose the signed-in user's identity, display name,
  role, status, and permission information to the admin console.
- **FR-007**: The admin console MUST load current user information after sign-in
  and after page refresh.
- **FR-008**: The admin console MUST show or hide menu entries according to the
  signed-in user's menu permissions.
- **FR-009**: The admin console MUST redirect unauthenticated users away from
  protected pages to the login page.
- **FR-010**: The admin console MUST clear authenticated state and return to the
  login page when the current sign-in state is invalid or expired.
- **FR-011**: The gateway entry MUST route browser access to the admin console.
- **FR-012**: The gateway entry MUST route admin console backend requests to the
  backend service without exposing internal service ports to users.
- **FR-013**: The feature MUST include at least one seeded administrator account
  for local verification.
- **FR-014**: The feature MUST include at least one seeded non-administrator
  account for local menu-permission verification.
- **FR-015**: The feature MUST preserve independent startup and verification for
  frontend, backend, and gateway modules.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `gateway`, `server`, `web`, `deploy`, `docs`.
- **Out of Scope**: `mcp`, `prometheus`, `grafana`, user management CRUD,
  password change, API key management, button-level permissions, audit logs,
  database migrations beyond what is needed for local seeded accounts.
- **Optional Runtime Impact**: MCP, Prometheus, and Grafana remain optional and
  are not required for this feature.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **Admin User**: A person who can sign in to the admin console. Key attributes:
  identifier, username, display name, role, status, and permissions.
- **Role**: A named grouping used to decide menu visibility. Initial roles are
  administrator and non-administrator.
- **Menu Permission**: A permission that determines whether a menu entry is
  visible to the signed-in user.
- **Authenticated State**: The user's current signed-in state used by the admin
  console to access protected pages and refresh current user information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A seeded administrator can sign in and reach the authenticated
  workspace within 30 seconds on a local development machine.
- **SC-002**: A seeded non-administrator can sign in and sees zero
  administrator-only menu entries.
- **SC-003**: An unauthenticated visitor attempting to open a protected page is
  redirected to the login page 100% of the time.
- **SC-004**: Invalid credentials are rejected 100% of the time and do not leave
  any authenticated state behind.
- **SC-005**: The same sign-in and current-user flow works through the gateway
  entry without requiring users to open separate frontend or backend ports.
- **SC-006**: The feature can be verified with documented local steps by someone
  who has not read the implementation code.

## Assumptions

- The initial integration uses username/password authentication for local
  framework verification.
- Local seeded users are sufficient for this first integration loop; full user
  management is a later feature.
- Menu-level permissions are enough for this first integration loop; button-level
  permissions are a later feature.
- The admin console can store authenticated state in the browser using the
  project's chosen secure mechanism from the implementation plan.
- The v5 project is reference material for desired behavior only; v6 must follow
  Ant Design Pro, Kratos, and Higress conventions.
