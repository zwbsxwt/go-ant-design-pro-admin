# Research: Dynamic Menu Linkage

## Decision: CurrentUser Carries Authorized Menu Tree

Use `GET /api/currentUser` to return both permission codes and authorized
directory/page menu tree.

**Rationale**: Ant Design Pro initial layout already fetches currentUser before
rendering protected pages, so this avoids an extra boot-time API call.

**Alternatives considered**:

- Dedicated `/api/system/current-user-menus`: more explicit but adds another
  boot-time request.
- Frontend-only filtering by permission codes: current state, but database menu
  names, sort, and status do not affect left navigation.

## Decision: Frontend Static Routes Remain Component Whitelist

Database menus influence display, but frontend code still owns which components
can render.

**Rationale**: Prevents arbitrary database component paths from becoming
runtime-loaded frontend code.

## Decision: Chinese Seed Names, Stable Permission Codes

Translate built-in names, keep permission codes unchanged.

**Rationale**: Display language changes should not break authorization logic,
role bindings, tests, or existing API consumers.

## Decision: MySQL DSN Uses Explicit utf8mb4

Add `charset=utf8mb4` to the local Kratos MySQL DSN.

**Rationale**: Chinese seed names must be stored and returned as UTF-8, and the
default client character set can otherwise produce mojibake during seed updates.
