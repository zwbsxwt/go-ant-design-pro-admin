# Data Model: Personal Center And Password Settings

## CurrentUserProfile

Represents the signed-in user's own profile.

- **id**: stable user id, read-only.
- **username**: login username, read-only.
- **display_name**: editable display name, required, max 64 characters.
- **avatar**: read-only preview URL or empty value.
- **email**: editable email, optional, max 128 characters, valid email format when present.
- **phone**: editable phone, optional, max 32 characters, numeric plus common separators when present.
- **status**: account status, read-only.
- **role_codes**: current role codes, read-only.

## UpdateProfileRequest

Editable personal profile fields.

- **display_name**: required, trimmed, 1-64 characters.
- **email**: optional, trimmed, valid email when non-empty.
- **phone**: optional, trimmed, max 32 characters, basic phone format when non-empty.

Validation rules:

- The request cannot change username, avatar, roles, status, menu permissions, or button permissions.
- Empty email and phone are allowed.
- Display name cannot be empty after trimming.

## ChangePasswordRequest

Security operation initiated by the signed-in user.

- **current_password**: required.
- **new_password**: required, at least 6 characters.
- **confirm_password**: required, must match `new_password`.

Validation rules:

- Current password must match the stored password hash.
- New password must pass the same minimum rule used by user management.
- On success, the current login token is revoked.

## SessionToken

Represents the current authenticated login state.

- **token**: bearer token sent by the frontend.
- **user_id**: owner of token.
- **expires_at**: existing token TTL behavior.

State transition:

```text
ACTIVE -> REVOKED
```

Password changes revoke the current token. Future features may revoke all tokens for the user, but v1 only requires the current token.
