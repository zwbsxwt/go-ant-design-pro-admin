# Kratos Backend Conventions

This project uses Go Kratos as the backend service foundation. Backend work MUST
keep the Kratos layout, protobuf-first API style, and layered boundaries intact.

## Scope

Use this guide when a feature touches `server/`, including protobuf APIs,
generated code, service handlers, business logic, data repositories, config,
dependency injection, OpenAPI output, tests, or runtime ports.

## Baseline Layout

The current service lives in `server/admin-service/` and follows the Kratos
layout:

```text
api/                  protobuf APIs and generated bindings
cmd/                  application entrypoints
configs/              local runtime configuration
internal/conf/        generated config types
internal/server/      HTTP and gRPC server construction
internal/service/     transport-facing service methods
internal/biz/         usecases, entities, errors, repository interfaces
internal/data/        repository implementations
openapi.yaml          generated OpenAPI document
```

Do not collapse `service`, `biz`, and `data` into a single package for speed.
Small features may keep implementations simple, but the layer boundaries must
remain visible.

## API Rules

- Define external APIs in protobuf before implementation.
- Include request, reply, and error definitions in the API contract.
- Use `google.api.http` annotations when HTTP endpoints are required.
- Keep REST and gRPC generated from the same proto source.
- Keep package names and version directories explicit, for example
  `api/admin/v1`.
- Use resource-oriented methods for CRUD-like APIs: create, get, list, update,
  delete.
- Use pagination, filtering, ordering, and field masks only when the feature
  requires them; do not add enterprise ceremony to a tiny endpoint.
- Regenerate bindings and OpenAPI after proto changes.

## Layer Rules

- `internal/service`: translate transport requests into usecase calls. Keep this
  layer thin. Do not put persistence logic here.
- `internal/biz`: define entities, usecases, domain errors, and repository
  interfaces. Business rules belong here.
- `internal/data`: implement repository interfaces and external persistence or
  integration clients. Do not leak storage-specific details upward.
- `internal/server`: configure HTTP/gRPC servers, middleware, and registration.
- `internal/conf`: represent config schema generated from proto.

Wire dependency injection MUST be updated when constructors or providers change.

## Error And Metadata Rules

- Prefer Kratos error definitions and generated error helpers for business
  errors.
- Error reasons MUST be stable machine-readable identifiers, for example
  `USER_NOT_FOUND`.
- HTTP and gRPC error behavior MUST remain consistent.
- Authentication, request IDs, tenant IDs, and similar cross-cutting values
  SHOULD flow through Kratos metadata/context patterns rather than ad hoc global
  state.

## Config And Runtime Rules

- Runtime defaults MUST be documented beside the service.
- The current local ports are HTTP `18000` and gRPC `19000`; do not return to the
  upstream template defaults `8000` and `9000` without a plan because `8000`
  conflicts with Ant Design Pro.
- Secrets MUST stay out of Git. Use environment files or deployment config
  templates when needed.
- Keep local sample data and in-memory repositories clearly marked as samples.

## Testing And Generation

Backend tasks SHOULD name the relevant checks:

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

After proto, Wire, or config changes, run the project generation commands
provided by the service `Makefile` where applicable:

```powershell
cd server/admin-service
make api
make config
make all
```

On Windows, use equivalent installed tools if `make` is unavailable. Record the
actual command in the feature quickstart or tasks.

## Integration Rules

- Frontend-facing API changes MUST be reflected in the feature contracts before
  `web/` code is changed.
- Gateway route changes MUST be planned with `gateway/` and `deploy/` scope
  called out explicitly.
- Do not add database, cache, auth, audit, or observability infrastructure as a
  side effect of a small endpoint. These are architecture-affecting changes and
  require SDD planning.

## Official References

- Kratos layout: https://go-kratos.dev/docs/intro/layout/
- Kratos API definition: https://go-kratos.dev/docs/component/api/
- Kratos protobuf guideline: https://go-kratos.dev/docs/guide/api-protobuf/
- Kratos errors: https://go-kratos.dev/docs/component/errors/
- Kratos examples: https://github.com/go-kratos/examples
