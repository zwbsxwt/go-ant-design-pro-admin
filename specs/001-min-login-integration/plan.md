# Implementation Plan: Minimum Login Integration

**Branch**: `001-min-login-integration` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-min-login-integration/spec.md`

## Summary

Build the first real integrated admin loop: Ant Design Pro signs in through
Kratos auth endpoints, loads current user and menu permission state from Kratos,
and reaches both frontend and backend through Higress. Keep the first slice
minimal by using seeded local users and menu-level permissions only; user
management, persistent accounts, button permissions, MCP, Prometheus, and Grafana
stay out of scope.

## Technical Context

**Language/Version**: Go 1.25 Kratos backend; React 19 + TypeScript 7 + Umi Max
4 + Ant Design Pro v6 frontend; Higress all-in-one gateway.

**Primary Dependencies**: Kratos HTTP/gRPC, protobuf + `google.api.http`, Wire,
Ant Design Pro layout/initialState/access/request, `@ant-design/pro-components`,
Higress Docker all-in-one.

**Storage**: In-memory seeded local users for this first integration loop. No
database migration in this feature.

**Testing**: `go test ./...`, Kratos build, frontend `npm run lint`,
`npm run test`, `npm run build`, gateway/browser smoke checks.

**Target Platform**: Local development on Windows with Docker; future Linux
deployment stays compatible through Docker Compose/deploy docs.

**Project Type**: Monorepo web admin template with gateway, Go service, and React
frontend modules.

**Performance Goals**: Local sign-in and current-user refresh should feel
instant for a seeded user; gateway route should not add noticeable delay.

**Constraints**: Preserve UTF-8; keep modules independently runnable; keep
Prometheus/Grafana/MCP optional; do not require MySQL/Redis for this feature;
keep frontend aligned with Ant Design Pro v6 conventions; keep backend
protobuf-first and layered.

**Scale/Scope**: Two seeded local users, three auth-related endpoints, menu-level
permissions, gateway route for frontend and `/api/*` backend traffic.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Real feature: PASS. `spec.md`, this `plan.md`, contracts, data model, and
  quickstart are created before implementation.
- Touched modules: PASS. In scope: `gateway/`, `server/`, `web/`, `deploy/`,
  `docs/`, `specs/001-min-login-integration/`. Out of scope: `mcp/`,
  `prometheus/`, `grafana/`.
- Contract-first: PASS. Backend HTTP shape is defined in
  `contracts/auth-api.yaml`; frontend and gateway contracts are also defined.
- Frontend conventions: PASS. Plan uses Ant Design Pro initialState, access,
  generated/request service conventions, and existing login page.
- Backend conventions: PASS. Plan uses protobuf-first Kratos API, service/biz/data
  layering, generated code, and Wire.
- Verification: PASS. `quickstart.md` defines independent module checks and an
  integrated gateway flow.
- UTF-8: PASS. All generated SDD artifacts are UTF-8.
- Optional modules: PASS. Prometheus, Grafana, and MCP remain optional.

## Project Structure

### Documentation (this feature)

```text
specs/001-min-login-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-api.yaml
│   ├── frontend-auth-contract.md
│   └── gateway-routes.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
gateway/
├── docker-compose.yml
└── README.md

server/
└── admin-service/
    ├── api/auth/v1/
    ├── internal/service/
    ├── internal/biz/
    ├── internal/data/
    ├── internal/server/
    ├── configs/
    └── openapi.yaml

web/
├── config/
├── src/app.tsx
├── src/access.ts
├── src/requestErrorConfig.ts
├── src/pages/user/login/
└── src/services/

deploy/
└── local integration compose or route notes, if needed

docs/
└── update developer notes only if runtime commands change
```

**Structure Decision**: Keep the existing top-level modules. Add an `auth/v1`
Kratos API alongside the generated Todo sample rather than replacing the sample
during this feature. Reuse Ant Design Pro's existing login, initialState, access,
and request structure instead of building a custom auth UI. Configure Higress as
the integrated entry point without making it the only way to run modules
independently.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/auth-api.yaml](./contracts/auth-api.yaml)
- [contracts/frontend-auth-contract.md](./contracts/frontend-auth-contract.md)
- [contracts/gateway-routes.md](./contracts/gateway-routes.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- Contract-first remains satisfied by the API, frontend, and gateway contracts.
- Frontend and backend convention documents were applied in the technical
  choices.
- Independent and integrated verification are documented.
- No optional observability or MCP runtime was introduced.
- No constitution violations require complexity tracking.

## Complexity Tracking

No constitution violations.
