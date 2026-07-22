# Prometheus

可插拔的 Prometheus 监控采集模块。

## 启动

```powershell
docker compose up -d
```

默认访问地址：

- Prometheus: http://localhost:9091

## Higress 指标采集

当前采集配置：

```yaml
scrape_configs:
  - job_name: higress-gateway
    metrics_path: /stats/prometheus
    static_configs:
      - targets:
          - higress-ai:15020
```

容器之间通过共享网络 `template-v6-observability` 通信。

## Grafana 数据源

Grafana 中已自动配置 Prometheus 数据源：

```text
higress-prometheus
```

这个值就是 Higress 控制台“Prometheus 数据源 UID”输入框要填写的内容。

