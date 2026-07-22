# AGENTS.md

本仓库是一个 SDD 驱动的后台管理框架模板验证工程。

## 必须遵守

- 所有新建和修改的文本文件必须使用 UTF-8 编码，避免中文乱码。
- 不要把第三方组件强行整合在一起；当前阶段先保证各模块独立可运行。
- 不要删除或重置用户已有改动。
- 不要把 Prometheus/Grafana 设为小项目默认必选运行组件，它们是可插拔观测模块。
- 功能性整合开始前，先按 Spec Kit / SDD 流程建立规格、计划和任务。
- Spec Kit 已初始化为 Codex skills 模式；正式 SDD 规则以 `.specify/memory/constitution.md` 为准。

## 先读这些

1. `specs/000-bootstrap/research.md`
   - 当前已跑通组件、端口、命令、资源占用和风险记录。

2. `spec-kit-skill/SKILL.md`
   - 本项目如何判断是否需要完整 SDD。

3. `spec-kit-skill/references/spec-kit-workflows.md`
   - Spec Kit 初次开发、增量开发、质量门禁和本项目 SDD 约定。

4. `.specify/memory/constitution.md`
   - 本项目正式 SDD 宪法，优先级高于普通开发习惯。

## 当前模块

```text
gateway/          Higress 网关层
server/           Kratos Go 后台服务
web/              Ant Design Pro 前台
mcp/              后续 MCP 服务预留
prometheus/       可插拔 Prometheus 监控采集
grafana/          可插拔 Grafana 监控面板
deploy/           部署配置预留
docs/             架构和开发文档预留
specs/            SDD 规格、计划、任务和 spike 记录
spec-kit-skill/   项目内 Spec Kit / SDD 使用经验和 skill
.specify/         Spec Kit 模板、脚本、宪法和集成状态
.agents/skills/   Spec Kit 为 Codex 生成的 `$speckit-*` skills
```

## 当前本地端口

```text
Higress Console:        http://localhost:8001
Higress Gateway HTTP:   http://localhost:18080
Higress Gateway HTTPS:  https://localhost:18443
Ant Design Pro:         http://localhost:8000
Kratos HTTP:            http://localhost:18000
Kratos gRPC:            localhost:19000
Prometheus:             http://localhost:9091
Grafana:                http://localhost:3003
```

## SDD 使用边界

当前单组件跑通属于 bootstrap spike，只需要记录在 `specs/000-bootstrap/research.md`。

Spec Kit 常用入口：

```text
$speckit-constitution
$speckit-specify
$speckit-clarify
$speckit-plan
$speckit-tasks
$speckit-implement
$speckit-converge
```

以下工作必须走完整 SDD：

- 登录、当前用户、菜单权限、按钮权限。
- Higress 路由前后端整合。
- Kratos API 契约和前端调用适配。
- MCP 服务接入主流程。
- 数据库、缓存、鉴权、审计、监控告警等会影响架构边界的能力。

建议第一条完整 SDD feature：

```text
最小登录整合闭环：
Ant Design Pro 登录 -> Kratos 当前用户/权限接口 -> Higress 路由转发
```

## 运行现状

- Higress 使用 all-in-one Docker 镜像运行。
- Ant Design Pro 使用 `npm start` 开发模式运行。
- Kratos 服务位于 `server/admin-service/`，由 Kratos v3 CLI 生成。
- Prometheus 采集 `higress-ai:15020/stats/prometheus`。
- Grafana 数据源 UID 是 `higress-prometheus`。

## 后续开发原则

- 先记录现状，再改动。
- 先定义契约，再写整合代码。
- 保持模块可单独启动和验证。
- 小项目默认轻量，大项目按需启用观测和 MCP。
- 任何端口、运行方式、资源占用的变化，都同步更新 bootstrap 或对应 feature 文档。
