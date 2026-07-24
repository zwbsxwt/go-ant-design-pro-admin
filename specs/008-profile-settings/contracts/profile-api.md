# Contract: Personal Center API

## Overview

All endpoints require the existing bearer token.

The profile API is for the current signed-in user only. It does not expose administrator user-management operations and does not accept role, status, permission, or avatar upload changes.

## GET /api/profile

Returns the signed-in user's profile.

### Response

```json
{
  "data": {
    "id": "user-admin",
    "username": "admin",
    "display_name": "Template Admin",
    "avatar": "https://example.local/avatar.png",
    "email": "admin@example.local",
    "phone": "",
    "status": "ACTIVE",
    "role_codes": ["admin"]
  }
}
```

### Rules

- Returns only the current signed-in user's profile.
- Returns `401` when the token is missing, expired, or invalid.

## PUT /api/profile

Updates editable personal profile fields.

### Request

```json
{
  "display_name": "管理员",
  "email": "admin@example.local",
  "phone": "13800138000"
}
```

### Response

```json
{
  "data": {
    "id": "user-admin",
    "username": "admin",
    "display_name": "管理员",
    "avatar": "https://example.local/avatar.png",
    "email": "admin@example.local",
    "phone": "13800138000",
    "status": "ACTIVE",
    "role_codes": ["admin"]
  }
}
```

### Rules

- Only `display_name`, `email`, and `phone` are accepted.
- Username, avatar, roles, status, menu permissions, and button permissions are not accepted as editable fields.
- Invalid fields return `400`.
- Invalid or expired token returns `401`.

## PUT /api/profile/password

Changes the signed-in user's password.

### Request

```json
{
  "current_password": "ant.design",
  "new_password": "new-password",
  "confirm_password": "new-password"
}
```

### Response

```json
{
  "success": true
}
```

### Rules

- Current password must be correct.
- New password and confirmation must match.
- New password must be at least 6 characters.
- On success, the current token is revoked and the frontend redirects to login.
- Old password must fail future login attempts.
- New password must succeed future login attempts.

## Frontend Route Contract

```text
/account/profile
```

Expected navigation:

- Right avatar dropdown contains `个人中心`.
- Clicking `个人中心` opens `/account/profile`.
- The route is protected by the existing logged-in user flow.
- The route should not require administrator menu permission.

## Gateway Contract

Higress continues to forward `/api/*` only.

No gateway authentication or route plugin changes are required.
