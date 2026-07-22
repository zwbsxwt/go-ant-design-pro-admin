# Gateway Route Contract

## Goal

Higress provides the integrated browser entry for the admin console and backend
auth API.

## Local Integrated Entry

- Gateway HTTP entry: `http://localhost:18080`
- Gateway console: `http://localhost:8001`

## Route Rules

| Match | Upstream | Purpose |
|-------|----------|---------|
| `/api/*` | Kratos HTTP service on `server/admin-service` local HTTP port | Auth and current-user requests |
| `/*` | Ant Design Pro frontend dev server or built frontend service | Browser page traffic |

## Header Rules

- Preserve `Host`.
- Preserve client IP forwarding headers where Higress supports it.
- Preserve `Authorization` for `/api/*` requests.

## Verification Rules

- Opening the gateway root loads the admin login page.
- `POST /api/login/account` through the gateway reaches Kratos.
- `GET /api/currentUser` through the gateway reaches Kratos with the bearer
  token intact.
- Direct module ports remain available for independent development checks.
