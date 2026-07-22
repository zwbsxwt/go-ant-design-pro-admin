# go-ant-design-pro-admin

[English](README.md) | 简体中文

这是一个 SDD 驱动的后台管理框架模板，组合了 Higress、Kratos、Ant Design Pro、
MySQL、Redis，并保留可插拔的 Prometheus / Grafana 观测模块。

本仓库适合作为后台管理系统的开源模板。它的核心思路是：前端、后端、网关、
MCP、观测模块先保持独立可运行，再通过 Spec Kit / SDD 规格逐步做功能整合。

## 已包含能力

- Ant Design Pro 精简模式后台前端。
- Kratos Go 后台服务。
- MySQL 持久化用户、角色、菜单、按钮权限 RBAC。
- Redis 存储本地登录 token。
- Higress 网关入口，用于本地一体化验证。
- Prometheus 和 Grafana 可选观测模块，适合较大项目按需启用。
- 已落地的 Spec Kit / SDD 规格、计划和任务文档。

当前已实现的基础功能：

- 登录和当前用户接口整合。
- 后台品牌名统一为 `go-ant-design-pro-admin`。
- Docker MySQL 和 Redis 本地数据底座。
- 系统管理 / 菜单管理。
- 系统管理 / 角色管理。
- 系统管理 / 用户管理。
- 角色绑定菜单权限和按钮权限。
- 用户绑定角色。

## 项目结构

```text
gateway/          Higress 网关层
server/           Kratos Go 后台服务
web/              Ant Design Pro 前台
mcp/              后续 MCP 服务预留
prometheus/       可选 Prometheus 监控采集
grafana/          可选 Grafana 监控面板
deploy/           部署和本地依赖配置
docs/             架构和开发规范
specs/            Spec Kit / SDD 规格、计划和任务
spec-kit-skill/   项目内 Spec Kit 使用指南
```

默认本地端口：

| 模块 | 地址 |
| --- | --- |
| Ant Design Pro | `http://localhost:8000` |
| Kratos HTTP | `http://localhost:18000` |
| Kratos gRPC | `localhost:19000` |
| Higress Console | `http://localhost:8001` |
| Higress Gateway HTTP | `http://localhost:18080` |
| Higress Gateway HTTPS | `https://localhost:18443` |
| MySQL | `localhost:3306` |
| Redis | `localhost:6379` |
| Prometheus，可选 | `http://localhost:9091` |
| Grafana，可选 | `http://localhost:3003` |

## 环境要求

- Docker Desktop。
- Go，版本需匹配 Kratos 服务工具链。
- Node.js `>=22`。
- npm。
- Git。

本地 Docker 内存建议：

- 只跑前端、后端、MySQL、Redis：4 GiB 通常够用。
- 跑完整本地链路，包括 Higress、前端、后端、MySQL、Redis：建议 8 GiB。
- Prometheus 和 Grafana 默认保持可选，小项目不建议默认启用。

## 快速开始

建议先启动轻量开发链路。这个链路不需要 Prometheus 和 Grafana。

1. 启动 MySQL 和 Redis：

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

2. 启动 Kratos 后端：

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
./bin/admin-service -conf ./configs
```

Windows PowerShell 可以使用：

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

3. 启动 Ant Design Pro 前端：

```powershell
cd web
npm install
npm run start:no-mock
```

4. 打开前端：

```text
http://localhost:8000/user/login
```

本地种子账号：

| 用户名 | 密码 | 权限 |
| --- | --- | --- |
| `admin` | `ant.design` | 完整系统管理权限 |
| `user` | `ant.design` | 普通用户权限 |

使用 `admin` 登录后可以打开：

```text
http://localhost:8000/system/user
```

## 网关模式

当你需要验证一体化浏览器入口时，可以启动 Higress：

```powershell
cd gateway
docker network create template-v6-observability
docker compose up -d
```

然后打开：

```text
http://localhost:18080/user/login
```

本地 Higress compose 默认把 `HIGRESS_GATEWAY_CONCURRENCY` 设为 `2`，用于让
all-in-one 镜像里的 Envoy 在较小 Docker Desktop 内存预算下保持稳定。只有在
Docker 内存预算比较宽裕时，才建议调大：

```powershell
$env:HIGRESS_GATEWAY_CONCURRENCY=4
docker compose up -d --force-recreate
```

网关路由细节见：

- [gateway/README.md](gateway/README.md)
- [deploy/auth-gateway.local.md](deploy/auth-gateway.local.md)

## 常用命令

后端：

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
buf generate --template buf.gen.yaml
go generate ./...
```

前端：

```powershell
cd web
npm run lint
npm run test
npm run build
```

数据依赖：

```powershell
docker compose -f deploy/docker-compose.local.yml ps
docker compose -f deploy/docker-compose.local.yml exec mysql mysqladmin ping -h 127.0.0.1 -uroot -proot
docker compose -f deploy/docker-compose.local.yml exec redis redis-cli ping
```

## SDD 基线

本项目已经用 Codex skills 模式初始化 Spec Kit。建议先阅读：

```text
.specify/memory/constitution.md
spec-kit-skill/SKILL.md
spec-kit-skill/references/spec-kit-workflows.md
AGENTS.md
```

Bootstrap spike 记录在 `specs/000-bootstrap/`。正式功能整合建议按以下流程：

```text
$speckit-specify
$speckit-plan
$speckit-tasks
$speckit-implement
```

已经实现的 feature specs：

```text
specs/001-min-login-integration/
specs/002-admin-branding-login-ui/
specs/003-system-data-foundation/
specs/004-system-menu-management/
specs/005-system-role-management/
specs/006-system-user-management/
```

以下类型的工作必须走 SDD：产品行为、API 契约、数据库结构、权限模型、网关
路由、观测能力、MCP 接入、部署边界。单纯的组件跑通或技术 spike 可以记录在
`specs/000-bootstrap/research.md`。

## 开发约定

- 所有文本文件保持 UTF-8。
- 前端、后端、网关、MCP、观测模块保持独立可运行。
- 前后端或网关整合前，先定义契约。
- 当前基线中 Higress 只负责路由，鉴权和权限判断由 Kratos 负责。
- Prometheus 和 Grafana 保持可选，不作为小项目默认必选依赖。
- 不提交本地运行数据、日志、`node_modules`、构建产物或嵌套上游仓库。

## 文档索引

- [AGENTS.md](AGENTS.md)：AI agent 使用本项目时必须遵守的规则。
- [.specify/memory/constitution.md](.specify/memory/constitution.md)：项目 SDD 宪法。
- [spec-kit-skill/SKILL.md](spec-kit-skill/SKILL.md)：项目内 Spec Kit 使用指南。
- [docs/frontend/ant-design-pro-conventions.md](docs/frontend/ant-design-pro-conventions.md)：前端规范。
- [docs/backend/kratos-conventions.md](docs/backend/kratos-conventions.md)：后端规范。
- [deploy/README.md](deploy/README.md)：本地 MySQL 和 Redis 启动说明。
- [specs/000-bootstrap/research.md](specs/000-bootstrap/research.md)：已验证端口、命令、资源占用和 bootstrap 记录。
