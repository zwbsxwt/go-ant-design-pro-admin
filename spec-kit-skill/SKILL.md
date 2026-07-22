---
name: spec-kit-skill
description: "Use for Spec Kit and Spec-Driven Development workflows in this repository: initializing or upgrading Spec Kit, deciding whether a task needs full SDD, writing or evolving constitution/spec/plan/tasks artifacts, running initial development or brownfield incremental development, and keeping AI agents aligned with project SDD rules."
---

# Spec Kit SDD

## Core Rule

Treat specifications as the source of truth. Do not begin functional integration work from code-first prompts when a spec should exist. For this repository, bootstrap spikes may be recorded lightly, but product features and cross-module integration must flow through Spec Kit artifacts.

## Decision Gate

Use full SDD when the work changes user-visible behavior, API contracts, auth, routing, permissions, data models, deployment topology, observability requirements, or cross-module integration.

Use a lightweight spike record when the work only validates whether a third-party component can run independently. Record results under `specs/000-bootstrap/`.

## Standard Workflow

1. Confirm Spec Kit is installed with `specify --version`; if needed, use `uv tool install specify-cli`.
2. Initialize or update the project integration only with user awareness because it writes `.specify/`, templates, scripts, and agent integration files.
3. Establish or update the project constitution before feature specs.
4. For each feature, create or evolve the spec before planning.
5. Produce a plan from the spec, including architecture choices and constitution checks.
6. Produce tasks from the plan and contracts.
7. Implement tasks in order, preserving traceability back to the spec.
8. After implementation, update specs when behavior changed; do not let code become the only truth.

## Project-Specific Defaults

- Monorepo modules: `gateway/`, `server/`, `web/`, `mcp/`, `prometheus/`, `grafana/`, `deploy/`, `docs/`, `specs/`.
- Encoding: write docs, configs, and code as UTF-8.
- Spec Kit project state: `.specify/`.
- Codex Spec Kit skills: `.agents/skills/speckit-*/SKILL.md`.
- Constitution: `.specify/memory/constitution.md`.
- Frontend conventions: `docs/frontend/ant-design-pro-conventions.md`.
- Backend conventions: `docs/backend/kratos-conventions.md`.
- Bootstrap evidence: `specs/000-bootstrap/research.md`.
- First full SDD feature should be the minimum integration loop: login, current user, menu permissions, and Higress routing between Ant Design Pro and Kratos.
- Observability is optional and pluggable; do not make `prometheus/` or `grafana/` part of the default small-project runtime without an explicit spec decision.

## References

Read `references/spec-kit-workflows.md` when you need concrete commands, artifact expectations, initial development flow, incremental development flow, or this repository's SDD conventions.
