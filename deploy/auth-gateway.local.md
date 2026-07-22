# Local Auth Gateway Flow

This note describes the optional local Higress route setup for the minimum login
integration feature.

## Scope

The route setup is for local verification only:

- Browser entry: `http://localhost:18080`
- Frontend upstream: static service source for `192.168.65.254:8000`
- Backend upstream: static service source for `192.168.65.254:18000`

Small projects may skip this gateway flow and use the direct module ports during
early development.

## Startup Order

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
./bin/admin-service -conf ./configs

cd ../../web
npm run start:no-mock

cd ../gateway
docker compose up -d
```

## Higress Route Rules

Resolve the Docker host address first:

```powershell
docker exec higress-ai sh -c "getent hosts host.docker.internal"
```

Register static service sources in the Higress console. The current local
Windows Docker runtime resolved `host.docker.internal` to `192.168.65.254`:

| Service source | Static address |
|----------------|----------------|
| `template-v6-web` | `192.168.65.254:8000` |
| `template-v6-api` | `192.168.65.254:18000` |

Create the API route before the frontend catch-all route:

| Priority | Match | Upstream | Notes |
|----------|-------|----------|-------|
| 1 | `/api/*` | `template-v6-api.static:80` | Preserve `Authorization` |
| 2 | `/*` | `template-v6-web.static:80` | Frontend dev server |
| 3 | `/` | `template-v6-web.static:80` | Root entry |

## Verification

1. Open `http://localhost:18080/user/login`.
2. Sign in with `admin / ant.design`.
3. Confirm the workspace loads.
4. Refresh the page.
5. Confirm `GET /api/currentUser` succeeds through Higress.
6. Sign out.
7. Sign in with `user / ant.design`.
8. Confirm admin-only menu entries are hidden.

## Troubleshooting

- If `/api/currentUser` returns unauthorized, confirm the browser request still
  sends `Authorization: Bearer <token>` and Higress preserves it.
- If `/api/login/account` reaches the frontend dev server, move `/api/*` above
  the `/*` route.
- If Higress returns 503, verify the route upstream uses `.static` service names
  and the static service source address uses the `IP:Port` format.
- If the host IP changes after Docker restarts, update the static service source
  addresses from the latest `getent hosts host.docker.internal` result.
