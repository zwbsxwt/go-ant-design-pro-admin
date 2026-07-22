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

