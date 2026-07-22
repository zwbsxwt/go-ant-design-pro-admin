# go-ant-design-pro-admin

SDD-driven admin framework template with Higress, Kratos, Ant Design Pro, and optional observability modules.

## Architecture

```text
gateway/          Higress gateway layer
server/           Kratos Go backend services
web/              Ant Design Pro frontend
mcp/              optional future MCP services
prometheus/       optional metrics collection
grafana/          optional dashboards
deploy/           deployment config
docs/             architecture and development guides
specs/            Spec Kit / SDD artifacts
spec-kit-skill/   local Spec Kit operating guide for AI agents
```

## SDD Baseline

Spec Kit is initialized in Codex skills mode. Start with:

```text
.specify/memory/constitution.md
spec-kit-skill/SKILL.md
spec-kit-skill/references/spec-kit-workflows.md
AGENTS.md
```

Bootstrap spikes live in `specs/000-bootstrap/`. Real feature integration should
flow through `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, and
`$speckit-implement`.
