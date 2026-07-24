# Research: Personal Center And Password Settings

## Decision: Use a dedicated current-user profile API

Add a self-service profile contract separate from `/api/system/users`.

**Rationale**: Administrator user management and personal self-service have different permission rules. A dedicated profile API prevents normal users from relying on administrator endpoints or accidentally exposing role/status updates.

**Alternatives considered**:

- Reuse `/api/system/users/{id}`: rejected because it is an administrator management API and carries fields that personal center must not update.
- Extend `/api/currentUser` with write operations: rejected because `currentUser` is currently a read-oriented auth endpoint.

## Decision: Keep avatar upload out of scope

Personal center may display the current avatar, but it will not upload or store files.

**Rationale**: Avatar upload requires file storage, content-type validation, storage permissions, public/private URL rules, and likely S3-compatible object storage. That deserves its own feature.

**Alternatives considered**:

- Store avatar file in database: rejected because it creates poor defaults for a reusable template.
- Store avatar file on local disk: rejected because it complicates deployment and does not match future S3 direction.
- Allow editing avatar URL manually: rejected for v1 to avoid unsafe external URL and broken-image concerns.

## Decision: Verify current password for self-service password changes

Require current password, new password, and confirmation.

**Rationale**: A logged-in browser session alone should not be enough to change a password. This also distinguishes self-service password change from administrator password reset.

## Decision: Revoke current token after password change

After password change, revoke the current token and redirect to login.

**Rationale**: This provides a clear security boundary and avoids stale in-memory currentUser state after a credential change.

## Decision: Reuse existing user table and token store

Use existing user fields and Redis token store.

**Rationale**: The current data model already contains display name, avatar, email, phone, status, password hash, and login token state. No new persistence dependency is needed.
