# Research: System Menu Management

## Decision: Model Buttons As Menu Permission Nodes

**Rationale**: A single permission tree can represent directories, pages, and
buttons, simplifying role binding and current-user payloads.

**Alternatives considered**: A separate button table was rejected for the first
template version because it adds joins without clear user value.

## Decision: Backend Enforces Management Permission

**Rationale**: UI hiding improves experience, but direct API calls must still be
authorized by Kratos.

**Alternatives considered**: Higress gateway authorization was rejected because
this batch explicitly keeps Higress as `/api/*` routing only.

## Decision: Use ProTable And Modal/Drawer Forms

**Rationale**: Menu management is a dense admin CRUD workflow, and the frontend
conventions prefer Ant Design Pro components for such pages.

**Alternatives considered**: A custom tree editor was deferred until the simple
CRUD workflow proves insufficient.
