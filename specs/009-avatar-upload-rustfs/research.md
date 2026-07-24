# Research: RustFS Avatar Upload And Display

## Decision: Use backend-mediated upload

**Decision**: The browser uploads the avatar to the Kratos backend, and the backend uploads the object to RustFS through the S3-compatible API.

**Rationale**: This keeps access key and secret key out of the browser, centralizes authentication and validation, and matches the current Kratos-owned auth boundary.

**Alternatives considered**:

- Direct browser-to-S3 upload with temporary credentials: better for large files, but requires signed policy or STS-style credentials and a larger security surface.
- Store avatar as database blob: simple but poor fit for static media and would bloat MySQL.

## Decision: Use environment variables for RustFS/S3 configuration

**Decision**: Runtime storage settings are loaded from environment variables or private local config. Repository files must use placeholder examples only.

**Rationale**: The user has a live RustFS server and credentials, but secrets must stay out of Git. Environment variables are also portable for Docker Compose, local shell, and future deployment.

**Required variables**:

```text
ADMIN_S3_ENDPOINT
ADMIN_S3_REGION
ADMIN_S3_ACCESS_KEY
ADMIN_S3_SECRET_KEY
ADMIN_S3_BUCKET
ADMIN_S3_FORCE_PATH_STYLE
ADMIN_S3_PUBLIC_BASE_URL
```

**Alternatives considered**:

- Commit config with real credentials: rejected because secrets must stay out of Git.
- Hard-code RustFS endpoint in backend: rejected because this template should be reusable.

## Decision: Store the final avatar URL in `system_users.avatar`

**Decision**: Reuse the existing user avatar field and store a browser-displayable avatar URL.

**Rationale**: The profile/currentUser flow already carries an avatar string, so this is the smallest useful data change. A separate object metadata table can be added later when audit, lifecycle, deduplication, or deletion becomes required.

**Alternatives considered**:

- Store only bucket/key and proxy every avatar through backend: safer for private buckets, but increases backend traffic and requires extra signed/proxy endpoints.
- Add avatar object metadata table now: useful later, but unnecessary for the first upload/display loop.

## Decision: Require public browser-readable avatar URL for first version

**Decision**: The uploaded object must be readable by the browser through `ADMIN_S3_PUBLIC_BASE_URL` or the RustFS endpoint/bucket public policy.

**Rationale**: The current admin UI expects avatar image URLs. Public read for avatar objects keeps the first version straightforward. Private avatars, signed URLs, and proxy download can be a later feature.

**Alternatives considered**:

- Signed URLs in currentUser: more private, but URL expiry complicates cached layout/avatar rendering.
- Backend avatar proxy: safer for private buckets, but requires additional route design and traffic considerations.

## Decision: Validate image type and size before storing

**Decision**: Allow `image/png`, `image/jpeg`, and `image/webp`; reject files larger than 2 MB.

**Rationale**: These formats cover common avatar usage, keep memory and storage predictable, and avoid accepting arbitrary uploads.

**Alternatives considered**:

- Allow GIF: deferred because animation and content scanning are not part of this feature.
- 5 MB limit: acceptable but larger than needed for an admin avatar; 2 MB is enough for first version.

## Decision: Do not auto-create bucket by default

**Decision**: The first implementation should fail with a clear storage configuration error if the bucket is missing. Quickstart documents bucket setup.

**Rationale**: Automatic bucket creation can hide deployment permission mistakes. Templates should make infrastructure assumptions visible.

**Alternatives considered**:

- Auto-create bucket on startup or upload: convenient locally, but requires broader permissions and may surprise production deployments.
