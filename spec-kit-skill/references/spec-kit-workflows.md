# Spec Kit Workflows For This Repository

## Table Of Contents

- Purpose
- Installed Tooling
- Spec Kit Concepts
- Initial Development
- Incremental Development
- Bootstrap Spike Policy
- Artifact Layout
- Command Notes
- Quality Gates
- Framework Template Guidance
- Common Prompts

## Purpose

This document teaches future agents how to use GitHub Spec Kit and SDD in this framework template. It is intentionally practical: follow it to decide when to write specs, what files to update, and how to keep Higress, Kratos, Ant Design Pro, MCP, Prometheus, and Grafana changes traceable.

## Installed Tooling

Current local setup:

```powershell
specify --version
# specify 0.13.2
```

If missing:

```powershell
python -m pip install --user uv
uv tool install specify-cli
```

On Windows, `specify.exe` may be available at:

```text
C:\Users\wentao\.local\bin\specify.exe
```

Spec Kit supports Codex skills integration during initialization:

```powershell
specify init --here --integration codex --integration-options="--skills"
```

This repository was initialized successfully on Windows/Codex with:

```powershell
& "C:\Users\wentao\.local\bin\specify.exe" init --here --force --integration codex --integration-options="--skills" --script ps --ignore-agent-tools
```

Use `--ignore-agent-tools` in the Codex desktop environment when agent detection
hangs after the "Specify Project Setup" panel. The project files are still
generated correctly; the flag only skips checking whether the agent CLI is
installed.

Run initialization only after confirming with the user, because it writes project infrastructure such as `.specify/`, scripts, templates, and agent integration files.

## Spec Kit Concepts

Spec-Driven Development inverts code-first development: specifications become the primary artifact, implementation plans translate intent into technical shape, and code expresses those plans. The intended order is:

```text
constitution -> specify -> clarify/analyze as needed -> plan -> tasks -> implement -> converge
```

Core commands after Spec Kit project initialization:

```text
/speckit.constitution  or skill speckit-constitution
/speckit.specify       or skill speckit-specify
/speckit.clarify       or skill speckit-clarify
/speckit.plan          or skill speckit-plan
/speckit.tasks         or skill speckit-tasks
/speckit.analyze       or skill speckit-analyze
/speckit.implement     or skill speckit-implement
/speckit.converge      or skill speckit-converge
```

In Codex skills mode, commands are exposed as `$speckit-*` skills rather than slash commands.

Initialized project files:

```text
.specify/memory/constitution.md
.specify/templates/
.specify/scripts/powershell/
.specify/workflows/speckit/
.specify/init-options.json
.specify/integration.json
.agents/skills/speckit-*/SKILL.md
```

## Initial Development

Use this flow for new features or the first real integrated product capability.

1. Define constitution.

   Capture non-negotiable project principles:

   - UTF-8 for all generated docs, configs, and source files.
   - Monorepo boundaries stay explicit.
   - Higress is gateway, Kratos is backend, Ant Design Pro is frontend.
   - Frontend work follows `docs/frontend/ant-design-pro-conventions.md`.
   - Frontend UI design also reads local Ant Design design language from
     `docs/frontend/design.md`.
   - Backend work follows `docs/backend/kratos-conventions.md`.
   - MCP is optional side capability, not core business coupling.
   - Prometheus/Grafana are optional observability modules.
   - Keep small-project runtime lean.

2. Specify.

   The spec should describe user needs and acceptance criteria, not implementation details. For the first integrated feature, describe:

   - User can log in from Ant Design Pro.
   - Frontend can fetch current user.
   - Menu permissions are returned from backend or mapped consistently.
   - Higress routes frontend/backend traffic predictably.

3. Clarify.

   Use clarification when auth method, session strategy, permission granularity, route shape, or deployment assumptions are ambiguous. Do not guess these silently.

4. Plan.

   Translate spec into concrete architecture:

   - Gateway route plan.
   - Kratos HTTP/gRPC service contract.
   - Frontend request adapter and proxy strategy.
   - Ant Design Pro / ProComponents page and component choices.
   - Ant Design visual language, Light theme, and token semantics from
     `docs/frontend/design.md` when UI is in scope.
   - Kratos service/biz/data layer ownership and generation steps.
   - Auth/session/token choice.
   - Test and verification approach.

5. Tasks.

   Generate implementation tasks from the plan and contracts. Tasks must be small, ordered, and traceable.

6. Implement.

   Implement tasks without broad unrelated refactors. Verify each module separately, then verify the integrated path.

7. Converge.

   Compare code against spec/plan/tasks and append remaining work if gaps remain.

## Incremental Development

Use this flow for brownfield changes after the framework already exists.

1. Identify whether behavior changed.

   If only refactoring with no behavioral change, update engineering notes if needed. If behavior changes, update the relevant spec first.

2. Evolve the spec.

   Add the new requirement, acceptance criteria, and changed assumptions to the feature directory under `specs/`.

3. Re-plan only the affected area.

   Keep old decisions unless invalidated. Record why a decision changes.

4. Regenerate or update tasks.

   Tasks should include migration, compatibility, tests, and docs when relevant.

5. Implement and verify.

   Run focused checks first, then cross-module checks if the change crosses boundaries.

6. Keep Spec Kit tooling updates separate.

   Do not mix upgrading `.specify/` templates or integrations with feature behavior changes in the same change unless the spec explicitly calls for it.

## Bootstrap Spike Policy

Current work is bootstrap/spike until the project begins functional integration. Spikes answer: "Can this component run independently, and what are the ports/resources/risks?"

Bootstrap results live in:

```text
specs/000-bootstrap/research.md
```

Use lightweight records for:

- Running Higress independently.
- Running Ant Design Pro independently.
- Running Kratos independently.
- Running Prometheus/Grafana independently.
- Recording ports, memory, known setup issues, and startup commands.

Do not create a full Spec Kit feature for each independent third-party component boot unless the user asks for a reusable production deployment feature.

## Artifact Layout

Expected `specs/` shape after full Spec Kit usage begins:

```text
specs/
  000-bootstrap/
    research.md
  001-auth-gateway-integration/
    spec.md
    plan.md
    research.md
    data-model.md
    contracts/
    quickstart.md
    tasks.md
```

Use feature-numbered directories for real features. Keep contracts beside the feature that owns them.

## Command Notes

Useful CLI checks:

```powershell
& "C:\Users\wentao\.local\bin\specify.exe" --version
& "C:\Users\wentao\.local\bin\specify.exe" check
& "C:\Users\wentao\.local\bin\specify.exe" self check
& "C:\Users\wentao\.local\bin\specify.exe" integration status
& "C:\Users\wentao\.local\bin\specify.exe" integration list
```

Initialize in this repository only with confirmation:

```powershell
& "C:\Users\wentao\.local\bin\specify.exe" init --here --force --integration codex --integration-options="--skills" --script ps --ignore-agent-tools
```

If the current directory is not empty, `--force` may be required. Do not use `--force` without reviewing what will be written.

## Quality Gates

Before implementation:

- Spec has measurable acceptance criteria.
- No unresolved `[NEEDS CLARIFICATION]` markers unless user explicitly accepts them as open assumptions.
- Plan passes constitution constraints or documents exceptions.
- API contracts exist before backend/frontend code.
- Verification path is listed in `quickstart.md` or `tasks.md`.

During implementation:

- Preserve UTF-8.
- Prefer existing framework conventions.
- Keep integration changes narrowly scoped.
- Do not make observability mandatory for small deployments without a spec decision.
- Verify local commands and record deviations.

After implementation:

- Run the checks named in the plan.
- Update bootstrap or feature docs with actual ports, commands, and known limitations.
- If production reality reveals a mismatch, update the spec before treating code as final.

## Framework Template Guidance

Current independent modules:

- `gateway/`: Higress all-in-one currently runs with UI on `8001`, gateway HTTP on host `18080`, HTTPS on host `18443`.
- `server/admin-service/`: Kratos HTTP on `18000`, gRPC on `19000`.
- `web/`: Ant Design Pro dev server on `8000`.
- `prometheus/`: Prometheus on `9091`, scraping `higress-ai:15020/stats/prometheus`.
- `grafana/`: Grafana on `3003`, datasource UID `higress-prometheus`.
- `mcp/`: reserved for future optional services.

When writing specs, be explicit about which modules are involved and which are intentionally out of scope.

Frontend and backend feature planning must also read:

- `docs/frontend/ant-design-pro-conventions.md`
- `docs/backend/kratos-conventions.md`

## Common Prompts

Initial constitution:

```text
Use $spec-kit-skill and Spec Kit to draft the project constitution for this SDD-driven admin framework. Include UTF-8, module boundaries, optional observability, Higress/Kratos/Ant Design Pro roles, and MCP as optional side services.
```

First real feature:

```text
Use $spec-kit-skill to create an SDD feature for the minimum login integration loop: Ant Design Pro login, Kratos current-user endpoint, menu permissions, and Higress routing.
```

Incremental feature:

```text
Use $spec-kit-skill to evolve the existing auth integration spec to add role-based button permissions, then update the plan and tasks before implementation.
```

Bootstrap record:

```text
Use $spec-kit-skill to record a lightweight bootstrap spike for a new optional module. Do not create a full feature spec unless behavior integration is required.
```
