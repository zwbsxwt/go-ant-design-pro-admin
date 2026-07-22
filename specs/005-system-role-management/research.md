# Research: System Role Management

## Decision: Role Code Is Stable And Unique

**Rationale**: Role codes are used in access checks and current-user payloads, so
they need stable machine-readable identity.

**Alternatives considered**: Using display names for checks was rejected because
names change and may be localized.

## Decision: Bind Roles To Unified Menu Permission Nodes

**Rationale**: Feature 004 models directories, pages, and buttons in one tree, so
role binding can select nodes from the same source.

**Alternatives considered**: Separate menu and button binding workflows were
deferred to avoid unnecessary UI and schema complexity.

## Decision: Protect Unsafe Role Deletes

**Rationale**: Deleting a role still assigned to users can unexpectedly remove
access or break current-user permissions.

**Alternatives considered**: Cascading deletes were rejected for the template
baseline because explicit cleanup is safer for administrators.
