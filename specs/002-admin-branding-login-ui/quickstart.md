# Quickstart: Admin Branding And Login UI

## Prerequisites

- Dependencies installed under `web/`.
- Ant Design Pro simple mode remains the active frontend baseline.

## Validation Steps

```powershell
cd web
npm run lint
npm run test
npm run build
npm start
```

Open `http://localhost:8000`.

Expected outcomes:

- Browser title shows `go-ant-design-pro-admin`.
- Login page uses `go-ant-design-pro-admin`.
- Footer and starter pages do not identify the product as the upstream demo app.
- Technical docs may still reference Ant Design Pro as the framework.

## Search Check

```powershell
rg "Ant Design Pro" web
```

Any remaining result must be a framework reference, not local product branding.
