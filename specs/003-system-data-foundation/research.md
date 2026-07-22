# Research: System Data Foundation

## Decision: Use MySQL As Durable RBAC Store

**Rationale**: The user asked for Docker MySQL, and admin templates commonly
need relational constraints for users, roles, menus, and binding tables.

**Alternatives considered**: SQLite was rejected because the target template is
closer to deployable backend services. Keeping memory-only data was rejected
because CRUD features need persistence.

## Decision: Use Redis As Derived Cache Or Session Store

**Rationale**: Redis can support login state, permissions cache, or future
session workflows while remaining rebuildable from MySQL.

**Alternatives considered**: Making Redis authoritative was rejected because it
would complicate recovery and data initialization.

## Decision: Docker Compose Defaults Only Include MySQL And Redis

**Rationale**: The constitution says small-project defaults must stay
lightweight. Observability is useful but should be pluggable.

**Alternatives considered**: Adding Prometheus and Grafana to the default chain
was rejected because the user already identified those modules as large-project
optional dependencies.

## Decision: Seed Admin And User Accounts Idempotently

**Rationale**: Repeated local setup should be safe. Seed data is needed to keep
the existing login loop usable after replacing in-memory users.

**Alternatives considered**: Manual SQL-only setup was rejected because it is too
easy for later agents to miss during local verification.
