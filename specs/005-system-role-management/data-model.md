# Data Model: System Role Management

## Role

- **id**: Stable unique identifier.
- **code**: Required unique machine-readable code.
- **name**: Required display name.
- **description**: Optional description.
- **status**: `enabled` or `disabled`.
- **created_at / updated_at**: Audit timestamps.

## Role Permission Binding

- **role_id**: Role reference.
- **menu_id**: Menu permission node reference.

## Permission Selection Tree

- Reuses Menu Permission nodes from feature 004.
- Directory, page, and button nodes may be selected.
- Disabled menu nodes are visible only if the implementation chooses to show
  disabled state; they must not be granted as active permissions.

## Validation Rules

- Role code is unique.
- Disabled roles grant no active permissions.
- Roles with user bindings cannot be deleted without a safe unbind path.
- Built-in roles may be protected from deletion.
- Permission bindings must reference existing menu permission nodes.
