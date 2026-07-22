# Grafana

可插拔的 Grafana 监控面板模块，默认通过 Docker Compose 启动。

## 启动

```powershell
docker compose up -d
```

默认访问地址：

- Grafana: http://localhost:3003
- 用户名: `admin`
- 密码: `admin`

## Higress 嵌入

Higress 控制台的“监控页面 URL”可以先填 Grafana 地址：

```text
http://localhost:3003
```

当前已经导入基础 Higress Gateway 看板，建议 Higress 控制台直接填写：

```text
http://localhost:3003/d/higress-basic/higress-gateway-basic?orgId=1&refresh=10s
```

当前本地配置已开启：

- `GF_SECURITY_ALLOW_EMBEDDING=true`
- `GF_AUTH_ANONYMOUS_ENABLED=true`
- `GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer`
- `GF_SECURITY_COOKIE_SAMESITE=lax`

这样 Higress 可以先把 Grafana 页面嵌进去体验。正式环境建议使用 HTTPS，并重新评估匿名访问策略。

本地使用 `http://localhost:3003` 时不要把 Cookie SameSite 设为 `none` 且 Secure 设为 `false`，浏览器会拒绝登录 Cookie，导致登录后改默认密码时出现 `Unauthorized`。如果正式环境必须跨站 iframe 嵌入，请使用 HTTPS，并设置 `GRAFANA_COOKIE_SAMESITE=none`、`GF_SECURITY_COOKIE_SECURE=true`。

## 后续接 Prometheus

Grafana 只是展示面板。Higress Gateway 指标由 Prometheus 采集：

```text
higress-ai:15020/stats/prometheus
```

当前已自动配置 Grafana Prometheus 数据源：

```text
higress-prometheus
```

这个值可填写到 Higress 控制台“Prometheus 数据源 UID”中，用于下载官方 Dashboard JSON。

## 已导入看板

- Higress Gateway Basic: http://localhost:3003/d/higress-basic/higress-gateway-basic?orgId=1&refresh=10s

看板 JSON 保存在：

```text
dashboards/higress-basic-dashboard.json
```
