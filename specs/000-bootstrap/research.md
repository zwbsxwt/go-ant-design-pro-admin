# Bootstrap Spike

Date: 2026-07-22

This spike validates that the framework modules can run independently before SDD-driven integration work begins.

## Goals

- Keep each module independently runnable.
- Avoid functional integration during bootstrap.
- Record ports, runtime commands, and resource concerns for later SDD decisions.
- Keep optional observability modules pluggable for larger deployments.

## Verified Modules

### Higress

- Directory: `gateway/`
- Runtime: Docker all-in-one image
- Container: `higress-ai`
- Console: `http://localhost:8001`
- Gateway HTTP: `http://localhost:18080`
- Gateway HTTPS: `https://localhost:18443`
- Note: Host port `8080` was unavailable on Windows, so host `18080` maps to container `8080`.

### Prometheus

- Directory: `prometheus/`
- Runtime: Docker Compose
- Container: `template-v6-prometheus`
- UI: `http://localhost:9091`
- Scrape target: `higress-ai:15020/stats/prometheus`
- Status: target `higress-gateway` verified as `up`.

### Grafana

- Directory: `grafana/`
- Runtime: Docker Compose
- Container: `template-v6-grafana`
- UI: `http://localhost:3003`
- Prometheus datasource UID: `higress-prometheus`
- Imported dashboards:
  - `http://localhost:3003/d/higress-basic/higress-gateway-basic?orgId=1&refresh=10s`
  - `http://localhost:3003/d/agq9g7/higress-dashboard?orgId=1&refresh=10s`
  - `http://localhost:3003/d/axtvlt/higress-ai-gateway-dashboard?orgId=1&refresh=10s`

### Ant Design Pro

- Directory: `web/`
- Runtime: `npm start`
- UI: `http://localhost:8000`
- Default mock login:
  - Username: `admin`
  - Password: `ant.design`
- Note: Development server memory usage was about 1.35 GiB.

### Kratos

- Directory: `server/admin-service/`
- Runtime: Kratos v3 CLI generated service
- HTTP: `http://localhost:18000`
- gRPC: `localhost:19000`
- Build command: `go build -o ./bin/ ./cmd/admin-service`
- Run command: `./bin/admin-service -conf ./configs`
- Verification:
  - `go test ./...` passed.
  - `POST /v1/todos/create` returned a created Todo JSON payload.
- Notes:
  - Default template ports `8000` and `9000` were changed to `18000` and `19000` to avoid conflicting with Ant Design Pro.
  - `buf` and `wire` were installed for code generation.
  - The template includes Todo sample code by default; no project-specific business logic has been added yet.
  - `protoc` is not installed globally; generation is handled through `buf`.

## Resource Notes

- Observability stack is useful for local full-stack testing and larger deployments.
- For small 4 GiB servers, Grafana and Prometheus should remain optional and not part of the default runtime.
- Observed memory usage:
  - Grafana: about 483 MiB
  - Prometheus: about 36 MiB
  - Higress all-in-one: about 534 MiB

## Next

- Spec Kit initialized in Codex skills mode.
- Project constitution established at `.specify/memory/constitution.md`.
- Next full SDD feature: login, current user, menu permissions, and gateway routing.
