# Gateway

Higress gateway module.

## Start

```powershell
docker network create template-v6-observability
docker compose up -d
```

Default local ports:

- Console: http://localhost:8001
- Gateway HTTP: http://localhost:18080
- Gateway HTTPS: https://localhost:18443

Runtime files are written to `higress-runtime/` and are ignored by Git.

The local compose file defaults `HIGRESS_GATEWAY_CONCURRENCY` to `2` to keep the
all-in-one Envoy process stable on Docker Desktop memory budgets around 4 GiB.
Override it only when the local Docker memory budget is comfortably higher:

```powershell
$env:HIGRESS_GATEWAY_CONCURRENCY=4
docker compose up -d --force-recreate
```

## Local Login Integration Routes

Use these routes only when verifying the SDD feature
`specs/001-min-login-integration`. Keep direct module ports available for
independent frontend and backend development.

Required local services:

- Ant Design Pro: `http://localhost:8000`
- Kratos HTTP: `http://localhost:18000`
- Higress gateway HTTP: `http://localhost:18080`

Higress all-in-one routes should point to registered static service sources.
Inside the container, resolve the host address first:

```powershell
docker exec higress-ai sh -c "getent hosts host.docker.internal"
```

On the current Windows Docker runtime this resolved to `192.168.65.254`.
Register these local static service sources in the Higress console:

| Service source | Static address |
|----------------|----------------|
| `template-v6-web` | `192.168.65.254:8000` |
| `template-v6-api` | `192.168.65.254:18000` |

Then create route upstreams that use the generated static service names:

| Match | Upstream | Purpose |
|-------|----------|---------|
| `/api/*` | `template-v6-api.static:80` | Kratos auth APIs |
| `/*` | `template-v6-web.static:80` | Ant Design Pro dev server |
| `/` | `template-v6-web.static:80` | Admin console root entry |

Header requirements for `/api/*`:

- Preserve `Authorization`.
- Preserve `Host` unless a later deployment needs explicit host rewriting.
- Keep normal forwarding headers such as `X-Forwarded-For` enabled.

Verification:

1. Start Kratos from `server/admin-service`.
2. Start Ant Design Pro with `npm run start:no-mock` from `web`.
3. Start Higress from `gateway`.
4. Configure the two static service sources and route rules above in the Higress console.
5. Open `http://localhost:18080/user/login`.
6. Sign in with `admin / ant.design`.
7. Refresh the authenticated page and confirm `/api/currentUser` still succeeds.

If login succeeds on `http://localhost:8000` but fails through
`http://localhost:18080`, first check that the `/api/*` route is ordered before
the catch-all frontend route and that `Authorization` is not stripped. If the
gateway returns 503, confirm the route upstream uses `.static` service names and
the static service source address is an `IP:Port` value reachable from the
`higress-ai` container.
