# Data Model: System Data Foundation

## User

- **id**: Stable unique identifier.
- **username**: Unique login name.
- **display_name**: Human-readable name.
- **password_hash**: Stored credential hash.
- **avatar**: Optional profile image URL.
- **status**: `enabled` or `disabled`.
- **created_at / updated_at**: Audit timestamps.

## Role

- **id**: Stable unique identifier.
- **code**: Unique machine-readable role code, such as `admin` or `user`.
- **name**: Human-readable role name.
- **description**: Optional role description.
- **status**: `enabled` or `disabled`.
- **created_at / updated_at**: Audit timestamps.

## Menu Permission

- **id**: Stable unique identifier.
- **parent_id**: Optional parent node.
- **type**: `directory`, `page`, or `button`.
- **name**: Display name.
- **path**: Route path for directory/page nodes.
- **component**: Frontend component identifier for page nodes.
- **permission_code**: Unique permission code for access checks.
- **icon**: Optional icon identifier.
- **sort**: Ordering value.
- **status**: `enabled` or `disabled`.

## User Role Binding

- **user_id**: User reference.
- **role_id**: Role reference.

## Role Menu Binding

- **role_id**: Role reference.
- **menu_id**: Menu permission reference.

## Cache Entry

- **key**: Cache key for login, session, or permission payload.
- **value**: Serialized derived state.
- **expires_at**: Optional expiration.

## Relationships

- A user may have many roles.
- A role may belong to many users.
- A role may grant many menu and button permission nodes.
- Menu permission nodes may form a tree.
- Cache entries are derived from users, roles, and menu permissions.
