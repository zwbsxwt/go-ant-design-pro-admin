# Research: Admin Branding And Login UI

## Decision: Keep Product Branding Separate From Framework References

**Rationale**: The local template name should be visible to users, while Ant
Design Pro remains important as the frontend framework and convention source.

**Alternatives considered**: Replacing every text occurrence globally was
rejected because it would corrupt documentation and dependency context.

## Decision: Scope Rename To Simple-Mode User-Facing Surfaces

**Rationale**: The project has already switched to Ant Design Pro simple mode.
Branding should update the current minimal surfaces instead of restoring example
modules.

**Alternatives considered**: Reintroducing full-mode demo pages was rejected
because this template is intended to grow through SDD features.

## Decision: No Backend Or Gateway Change

**Rationale**: Product text does not affect API contracts, gateway routes, or
authentication behavior.

**Alternatives considered**: Adding a backend-powered branding endpoint was
rejected as unnecessary for this static template rename.

## Decision: Keep Learning Links Branded As Ant Design

**Rationale**: The Welcome page includes framework learning cards for Ant
Design and ProComponents. Those labels describe upstream resources, not the
local product identity, so they remain valid exceptions under the branding
contract.

**Alternatives considered**: Renaming those learning links was rejected because
it would make official framework references misleading.
