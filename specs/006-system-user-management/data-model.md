# Data Model: System User Management

## User

- **id**: Stable unique identifier.
- **username**: Required unique login name.
- **display_name**: Required human-readable name.
- **avatar**: Optional profile image URL.
- **email**: Optional contact field.
- **phone**: Optional contact field.
- **password_hash**: Stored credential hash.
- **status**: `enabled` or `disabled`.
- **created_at / updated_at**: Audit timestamps.

## User Role Binding

- **user_id**: User reference.
- **role_id**: Role reference.

## Resolved Permission Set

- **user**: Basic user profile.
- **roles**: Active enabled role codes.
- **menus**: Active enabled directory/page permission codes.
- **buttons**: Active enabled button permission codes.

## Password Reset

- **target_user_id**: User whose password changes.
- **reset_password**: New credential accepted by validation rules.
- **result**: Password hash is updated; raw password is not returned.

## Validation Rules

- Username is unique.
- Disabled users cannot log in.
- Disabled users fail current-user refresh.
- Role bindings reference existing enabled roles when active permissions are
  resolved.
- Raw password and password hash are never returned to frontend user lists.
