# Research: Minimum Login Integration

## Decision: Keep Ant Design Pro Default Auth Routes For The First Slice

Use the existing Ant Design Pro route shape:

- `POST /api/login/account`
- `GET /api/currentUser`
- `POST /api/login/outLogin`

### Rationale

The current frontend already calls these routes from `web/src/services` and
loads current user through `getInitialState`. Keeping this route shape proves the
integration with fewer frontend changes and lets the plan focus on replacing
mock data with Kratos-backed behavior.

### Alternatives Considered

- Use the v5 route shape `/api/auth/login` and `/api/auth/me`: rejected for this
  first slice because it would force more Ant Design Pro service and login-page
  changes before the integration path is proven.
- Introduce a new `/api/admin/auth/*` route family: rejected for now because the
  benefit is mostly naming cleanliness, not user value.

## Decision: Kratos Protobuf-First Auth API

Add `api/auth/v1` protobuf definitions for login, current user, logout, and
errors. Use `google.api.http` annotations to map those methods to the route shape
above.

### Rationale

This follows the backend convention document and keeps HTTP and gRPC generated
from one source. It also gives the frontend a stable contract before code is
implemented.

### Alternatives Considered

- Hand-write only HTTP handlers: rejected because it violates the Kratos
  protobuf-first convention.
- Use only the existing Todo API: rejected because auth and current-user payloads
  are a separate domain.

## Decision: Seeded In-Memory Users For The First Feature

Provide one administrator and one non-administrator seeded user for local
verification.

### Rationale

The feature's purpose is to prove the first integration loop, not to build the
account-management subsystem. Avoiding MySQL/Redis keeps the first slice small
and preserves independent module startup.

### Alternatives Considered

- Add database persistence now: rejected because it expands scope into migrations,
  account lifecycle, and deployment state.
- Keep frontend mocks only: rejected because the spec requires backend current
  user and permission integration.

## Decision: Menu-Level Permission First

Use a simple role/access value plus menu permission identifiers for menu
visibility. Button permissions are explicitly out of scope.

### Rationale

Ant Design Pro already uses `currentUser.access` and route `access` checks. A
minimal role/access model proves menu visibility while leaving a later feature
free to design finer-grained button permissions.

### Alternatives Considered

- Full RBAC with role, resource, action, and button permissions: rejected because
  it is a larger authorization feature.
- Hard-code admin checks only in the frontend: rejected because menu permission
  state must come from the backend.

## Decision: Bearer Token Auth For Local Integration

Use a bearer token returned from login and attached to protected requests. The
token validation is handled in Kratos middleware/service code for this feature.

### Rationale

This mirrors the behavior proven in v5, is easy to validate locally, and fits the
existing frontend request interceptor point. It avoids server-side session
storage for the first slice.

### Alternatives Considered

- Cookie session: viable for production, but requires same-site and gateway cookie
  decisions that are not needed for the first local integration.
- No token and rely on mock state: rejected because it does not prove protected
  backend requests.

## Decision: Higress Routes `/api/*` To Backend And Page Traffic To Frontend

Use Higress as the integrated browser entry. Route backend API requests by path
prefix and route other browser traffic to the frontend.

### Rationale

This mirrors the v5 Nginx proxy behavior while using the v6 gateway choice. It
keeps users from needing internal service ports during integrated verification.

### Alternatives Considered

- Frontend dev proxy only: useful for module development but does not prove
  gateway integration.
- Direct backend port access in the browser: rejected because the gateway is in
  scope for this feature.
