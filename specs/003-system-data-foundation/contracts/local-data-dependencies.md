# Local Data Dependencies Contract

## Default Services

### MySQL

- **Purpose**: Durable users, roles, menus, button permissions, and bindings.
- **Default Port**: `3306`.
- **Default Database**: `go_ant_design_pro_admin`.
- **Default Local User**: `root`.
- **Default Local Password**: Development-only value documented beside deploy
  config; production secrets stay out of Git.

### Redis

- **Purpose**: Login state, permission cache, or future session cache.
- **Default Port**: `6379`.
- **Source Of Truth**: No. Redis data must be rebuildable from MySQL.

## Required Startup Behavior

- Default local dependency startup includes MySQL and Redis.
- Default local dependency startup does not require Prometheus or Grafana.
- Optional observability can remain in `prometheus/` and `grafana/` with its own
  startup path.

## Seed Data Contract

- User `admin` exists and has administrator role.
- User `user` exists and has normal user role.
- Password for both seeded local accounts remains `ant.design`.
- Seed initialization is idempotent.
