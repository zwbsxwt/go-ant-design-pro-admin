# Feature Specification: System Data Foundation

**Feature Branch**: `003-system-data-foundation`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Docker 可以放 MySQL 和 Redis；当前内存种子用户迁移为数据库初始化种子数据；Grafana/Prometheus 继续可插拔。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Local Data Dependencies (Priority: P1)

As a developer, I can start MySQL and Redis locally with documented Docker
commands without also starting optional observability modules.

**Why this priority**: System management features need durable storage, but the
default local stack must stay small-project friendly.

**Independent Test**: Start only the default local dependencies and confirm MySQL
and Redis accept connections.

**Acceptance Scenarios**:

1. **Given** Docker Desktop has 8G memory available, **When** the developer
   starts the default local dependency stack, **Then** MySQL and Redis become
   reachable on documented local ports.
2. **Given** the default stack is started, **When** the developer checks running
   containers, **Then** Prometheus and Grafana are not required containers.

---

### User Story 2 - Use Seeded Admin Data From Storage (Priority: P2)

As a developer, I can initialize local data and sign in with seeded admin and
user accounts backed by the data store instead of hard-coded in-memory data.

**Why this priority**: Later menu, role, and user management cannot be credible
while identity and permissions are only memory fixtures.

**Independent Test**: Initialize data, start the backend, sign in with seeded
accounts, and confirm current user data comes from persisted seed records.

**Acceptance Scenarios**:

1. **Given** an empty local database, **When** initialization runs, **Then** seed
   users, roles, menus, and bindings are created exactly once.
2. **Given** seeded data exists, **When** the backend starts, **Then** current
   login behavior can use the persisted users and roles.

---

### User Story 3 - Cache Permission Or Session State Safely (Priority: P3)

As a developer, I have Redis available for login state, permission cache, or
future session cache without making cache availability hide database truth.

**Why this priority**: Redis is useful for future growth, but authorization must
remain explainable and recoverable from durable records.

**Independent Test**: Start Redis, verify connectivity, and confirm the backend
has documented behavior for cache miss or cache restart.

**Acceptance Scenarios**:

1. **Given** Redis is empty, **When** a user signs in or refreshes permissions,
   **Then** the system can rebuild needed state from durable records.
2. **Given** Redis is unavailable locally, **When** the backend starts, **Then**
   the failure is clear and does not silently fall back to insecure behavior.

### Edge Cases

- Re-running seed initialization must not duplicate users, roles, menus, or
  bindings.
- Docker ports may already be in use; documentation must state defaults and
  where to change them.
- Secrets must stay out of Git; committed files may contain local development
  defaults only.
- MySQL and Redis are default local dependencies for admin features; Grafana,
  Prometheus, MCP, and Higress observability remain optional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST provide a default local Docker dependency
  definition for MySQL and Redis.
- **FR-002**: The default local dependency documentation MUST exclude Grafana and
  Prometheus from the required small-project startup path.
- **FR-003**: The backend MUST have a planned durable schema for users, roles,
  menus, button permissions, and binding relationships.
- **FR-004**: The backend MUST initialize seed data for `admin` and `user`
  accounts, including roles and permissions.
- **FR-005**: Seed initialization MUST be idempotent.
- **FR-006**: Redis MUST be available for session or permission cache use, with
  cache-miss behavior defined as rebuilding from durable records.
- **FR-007**: Runtime ports, credentials, database names, and memory assumptions
  MUST be documented for local development.
- **FR-008**: The current in-memory auth repository MUST be replaced by a
  storage-backed path during implementation of this feature.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server`, `deploy`, `docs`, `specs`.
- **Out of Scope**: `web` UI CRUD pages, `gateway` route changes, `mcp`,
  `prometheus`, `grafana`.
- **Optional Runtime Impact**: Prometheus and Grafana stay optional and are not
  part of default local dependency startup.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **User**: A login identity with username, display name, password credential,
  status, and role bindings.
- **Role**: A named permission group with unique code, display name, description,
  and status.
- **Menu Permission**: A directory, page, or button permission node that can be
  assigned to roles.
- **User Role Binding**: A relationship connecting users to roles.
- **Role Menu Binding**: A relationship connecting roles to menu and button
  permission nodes.
- **Cache Entry**: A derived session or permission record that can be rebuilt
  from durable storage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can start MySQL and Redis and verify both connections
  within 5 minutes using documented local steps.
- **SC-002**: Running seed initialization twice leaves one logical copy of each
  seeded user, role, menu, and binding.
- **SC-003**: Seeded `admin` and `user` accounts can still complete login and
  current-user verification after backend restart.
- **SC-004**: The default local dependency startup does not require Prometheus or
  Grafana containers.
- **SC-005**: Docker Desktop with 8G memory can run Higress, frontend, backend,
  MySQL, and Redis for local verification without recurring OOM restarts.

## Assumptions

- MySQL is the default durable store for this template.
- Redis is available for cache/session support but is not the source of truth.
- Local seed credentials remain `admin / ant.design` and `user / ant.design`
  until a later password policy feature changes them.
- Production secret management is out of scope for this local data foundation.
