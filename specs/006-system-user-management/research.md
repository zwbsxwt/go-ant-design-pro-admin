# Research: System User Management

## Decision: Database Is Source Of Truth For Login And Current User

**Rationale**: User CRUD must affect authentication and permissions immediately
after refresh, so memory fixtures are no longer acceptable.

**Alternatives considered**: Keeping seeded in-memory users was rejected because
it would conflict with admin-managed users and role bindings.

## Decision: Current User Returns Role, Menu, And Button Codes

**Rationale**: Frontend routing/menu visibility and button-level access need a
single current-user payload to initialize access state.

**Alternatives considered**: Separate permission endpoints were deferred to keep
the first RBAC loop simple.

## Decision: Password Reset Is Admin-Driven

**Rationale**: The requested baseline includes reset password, not full
self-service recovery or SSO.

**Alternatives considered**: Email recovery and SSO were deferred as separate
future specs because they affect security and deployment boundaries.
