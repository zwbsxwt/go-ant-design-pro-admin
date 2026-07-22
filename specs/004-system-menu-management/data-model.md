# Data Model: System Menu Management

## Menu Permission

- **id**: Stable unique identifier.
- **parent_id**: Optional parent menu identifier.
- **type**: `directory`, `page`, or `button`.
- **name**: Required display name.
- **path**: Route path for directory/page nodes.
- **component**: Frontend component identifier for page nodes.
- **permission_code**: Required unique code used by routes and buttons.
- **icon**: Optional icon identifier.
- **sort**: Integer order among siblings.
- **status**: `enabled` or `disabled`.
- **created_at / updated_at**: Audit timestamps.

## Validation Rules

- Permission code is unique.
- A node cannot be its own parent or ancestor.
- Button nodes may omit route and component values.
- Page nodes require a route path and component identifier.
- Directory nodes may omit component.
- Deletion must protect descendants and existing role bindings.

## State Transitions

- `enabled` -> `disabled`: Node stops granting active permission.
- `disabled` -> `enabled`: Node can grant permission if ancestors are valid.
- `existing` -> `deleted`: Allowed only when binding and descendant rules pass.
