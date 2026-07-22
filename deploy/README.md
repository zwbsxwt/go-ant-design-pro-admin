# Local Deploy Guide

This directory contains local deployment helpers for the template. The default
small-project dependency stack only starts MySQL and Redis.

## Default Data Dependencies

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
docker compose -f deploy/docker-compose.local.yml ps
```

Expected local ports:

- MySQL: `localhost:3306`
- Redis: `localhost:6379`

Development defaults:

- MySQL database: `go_ant_design_pro_admin`
- MySQL user: `root`
- MySQL password: `root`
- Seeded users: `admin / ant.design` and `user / ant.design`

These values are for local template verification only. Production secrets must
not be committed to Git.

## Verify Connections

```powershell
docker compose -f deploy/docker-compose.local.yml exec mysql mysqladmin ping -h 127.0.0.1 -uroot -proot
docker compose -f deploy/docker-compose.local.yml exec redis redis-cli ping
```

Expected output:

- MySQL returns `mysqld is alive`.
- Redis returns `PONG`.

## Optional Observability

Prometheus and Grafana remain pluggable modules. Do not include them in the
default small-project startup command unless a feature spec explicitly changes
that runtime boundary.
