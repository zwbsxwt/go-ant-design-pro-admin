<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- PRINCIPLE_1_NAME -> I. Spec-First Integration
- PRINCIPLE_2_NAME -> II. Explicit Module Boundaries
- PRINCIPLE_3_NAME -> III. Contract-First APIs
- PRINCIPLE_4_NAME -> IV. Independent Runtime Verification
- PRINCIPLE_5_NAME -> V. UTF-8 And Operable Defaults
Added sections:
- Monorepo Architecture
- Development Workflow
Removed sections:
- Placeholder template sections
Templates requiring updates:
- .specify/templates/plan-template.md: updated
- .specify/templates/spec-template.md: updated
- .specify/templates/tasks-template.md: updated
Follow-up TODOs:
- None
-->

# go-ant-design-pro-admin Constitution

## Core Principles

### I. Spec-First Integration

Functional product work MUST begin from Spec Kit artifacts before code changes. A
feature that changes user-visible behavior, API contracts, routing, permissions,
data models, deployment topology, observability requirements, or cross-module
integration MUST have a feature directory under `specs/` with `spec.md`,
`plan.md`, and `tasks.md` before implementation.

Bootstrap spikes MAY be recorded lightly when they only prove that a third-party
component can run independently. Spike evidence MUST live under
`specs/000-bootstrap/` and MUST NOT silently become product behavior.

### II. Explicit Module Boundaries

The repository is a monorepo template, but each top-level module MUST remain
independently understandable and runnable unless a feature spec explicitly
changes that boundary. Higress owns gateway concerns, Kratos owns backend API
and service logic, Ant Design Pro owns the admin frontend, MCP services are
optional side capabilities, and Prometheus/Grafana are optional observability
modules.

Small-project defaults MUST stay lightweight. Optional modules MUST NOT become
required runtime dependencies unless a spec records the deployment reason,
resource cost, and fallback behavior.

### III. Contract-First APIs

Any frontend/backend/gateway integration MUST define the external contract before
implementation. Kratos HTTP/gRPC interfaces, frontend request shapes, gateway
routes, auth/session behavior, and permission payloads MUST be captured in the
feature plan and contracts before code is wired together.

Backend and frontend changes MUST preserve traceability to the same user story.
Breaking contract changes require a migration note or compatibility decision in
the plan.

### IV. Independent Runtime Verification

Each module touched by a feature MUST have a local verification path in
`quickstart.md`, `tasks.md`, or the relevant bootstrap record. Verification MUST
include the ports, commands, expected health checks, and any known conflicts.

Cross-module features MUST be validated in two layers: each module works by
itself, then the integrated path works through the intended boundary. A change is
not complete when it only works through mocks unless the spec explicitly scopes
the feature to mocks.

### V. UTF-8 And Operable Defaults

All new and modified text files, including Markdown, YAML, JSON, TOML, shell
scripts, Go, TypeScript, and configuration files, MUST be written as UTF-8.
Chinese text MUST be preserved without mojibake.

Default ports, credentials, and environment variables MUST be documented beside
the module that uses them. Secrets MUST stay out of Git. Generated dependencies,
runtime data, logs, build outputs, and vendored upstream repositories MUST remain
ignored unless a spec explicitly requires committing a generated artifact.

## Monorepo Architecture

The canonical top-level layout is:

```text
gateway/          Higress gateway layer
server/           Kratos Go backend services
web/              Ant Design Pro frontend
mcp/              optional future MCP services
prometheus/       optional metrics collection
grafana/          optional dashboards
deploy/           docker-compose, k8s, helm, nacos, and deployment config
docs/             architecture, conventions, and development guides
specs/            SDD specifications, plans, tasks, and spike records
spec-kit-skill/   local Spec Kit operating guide for future agents
.specify/         Spec Kit templates, scripts, memory, and integration state
.agents/skills/   generated Spec Kit skills for Codex
```

Features MUST state which modules are in scope and which modules are intentionally
out of scope. Shared abstractions are allowed only when they remove real
cross-module duplication or establish a contract already approved by the spec.

## Development Workflow

New real features follow this order:

```text
constitution -> specify -> clarify when needed -> plan -> tasks -> implement -> converge
```

The first recommended full feature is the minimal login integration loop:
Ant Design Pro login, Kratos current-user and permission contract, and Higress
routing.

Incremental changes MUST update existing specs before implementation when
behavior or contracts change. Tooling-only changes, dependency upgrades, and
bootstrap records SHOULD be committed separately from product behavior changes.

## Governance

This constitution supersedes conflicting local habits, generated defaults, and
ad hoc implementation notes. Pull requests and AI-authored changes MUST check
the relevant feature artifacts against these principles before implementation is
treated as complete.

Amendments require updating this file, adding a Sync Impact Report, and syncing
affected templates or guidance documents in the same change. Versioning follows
semantic versioning: MAJOR for incompatible governance changes, MINOR for new or
materially expanded principles, and PATCH for clarifications that do not change
meaning.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
