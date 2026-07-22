# Data Model: Minimum Login Integration

## AdminUser

Represents a user who can sign in to the admin console.

### Fields

- `id`: Stable user identifier.
- `username`: Unique login name.
- `displayName`: Human-readable name shown in the admin console.
- `role`: User role. Initial values: `admin`, `user`.
- `status`: Account state. Initial values: `ACTIVE`, `DISABLED`.
- `avatar`: Optional avatar URL for Ant Design Pro display.
- `menuPermissions`: List of menu permission identifiers.

### Validation Rules

- `username` is required.
- `displayName` is required for seeded users.
- `role` must be one of the initial role values.
- `status` must be `ACTIVE` to sign in or refresh current user.
- Disabled users cannot receive a valid authenticated state.

## Role

Represents a coarse-grained local permission group for the first integration
loop.

### Initial Roles

- `admin`: Can see administrator-only menu entries.
- `user`: Can see normal menu entries only.

### Validation Rules

- A user must have exactly one role.
- Unknown roles are treated as non-administrator for menu visibility.

## MenuPermission

Represents a menu entry permission sent to the frontend.

### Fields

- `key`: Stable permission identifier, for example `menu.dashboard` or
  `menu.admin`.
- `label`: Optional display label for diagnostics or future dynamic menus.

### Initial Permissions

- Admin users receive normal menu permissions and administrator menu permission.
- Non-administrator users receive normal menu permissions only.

## AuthenticatedState

Represents the browser's current signed-in state.

### Fields

- `token`: Opaque bearer token returned after successful login.
- `currentUser`: Current user profile loaded from the backend.
- `expiresAt`: Optional expiration timestamp when provided by the backend.

### State Transitions

```text
Unauthenticated -> Authenticated: valid login
Authenticated -> Unauthenticated: logout, invalid token, expired token, disabled user
Authenticated -> Authenticated: successful current-user refresh
Unauthenticated -> Unauthenticated: invalid login
```
