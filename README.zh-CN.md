# go-ant-design-pro-admin

[English](README.md) | 简体中文

这是一个 SDD 驱动的后台管理框架模板，组合 Higress、Kratos、Ant Design Pro、MySQL、Redis，并保留可插拔的 Prometheus / Grafana 观测模块。

本仓库适合作为后台管理系统的开源模板。前端、后端、网关、MCP、观测模块保持独立可运行，功能整合通过 Spec Kit / SDD 规格推进。

## 已包含能力

- Ant Design Pro 精简模式后台前端。
- Kratos Go 后台服务。
- MySQL 持久化用户、角色、菜单、模块、按钮权限 RBAC。
- Redis 存储本地登录 token。
- Higress 网关入口，用于本地一体化验证。
- Prometheus 和 Grafana 可选观测模块，适合较大项目按需启用。
- 已落地的 Spec Kit / SDD 规格、计划和任务文档。

## 项目结构

```text
gateway/          Higress 网关层
server/           Kratos Go 后台服务
web/              Ant Design Pro 前台
mcp/              后续 MCP 服务预留
prometheus/       可选 Prometheus 监控采集
grafana/          可选 Grafana 监控面板
deploy/           部署和本地依赖配置
docs/             架构和开发文档
specs/            Spec Kit / SDD 规格、计划和任务
spec-kit-skill/   项目内 Spec Kit 使用指南
```

## 快速开始

1. 启动 MySQL 和 Redis：

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

MySQL 容器会挂载 Kratos 后端同一套 migration 和 seed SQL。Docker 只会在 `mysql-data` volume 第一次创建时执行这些初始化脚本。

2. 启动 Kratos 后端：

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

后端启动时也会执行 embedded migration 和 seed 脚本，因此已有本地库也可以通过后端启动进行幂等修复和更新。

3. 启动前端无 mock 模式：

```powershell
cd web
npm install
npm run start:no-mock
```

4. 打开：

```text
http://localhost:8000/user/login
```

本地初始化账号：

| 用户名 | 密码 | 权限 |
| --- | --- | --- |
| `admin` | `ant.design` | 完整系统管理权限 |
| `user` | `ant.design` | 普通用户权限 |

## 网关模式

需要验证一体化浏览器入口时，可以启动 Higress：

```powershell
cd gateway
docker network create template-v6-observability
docker compose up -d
```

然后打开：

```text
http://localhost:18080/user/login
```

## 重置本地数据

如果需要从空库重新初始化：

```powershell
docker compose -f deploy/docker-compose.local.yml down
docker volume rm deploy_mysql-data
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

如果 Docker 使用了其它项目名前缀，可以先运行 `docker volume ls`，再删除对应的 `mysql-data` volume。

## 项目名称配置

模板名称和描述集中配置在：

```text
web/config/appConfig.ts
```

前端标题、登录页、页脚和示例页面会读取这个配置。后续改成具体业务项目时，优先修改这个文件。

## 常用命令

后端：

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
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

中文 SDD 工作台入口：[specs/README.zh-CN.md](specs/README.zh-CN.md)。

涉及产品行为、API 契约、数据库结构、权限模型、网关路由、观测能力、MCP 接入、部署边界的工作，应先走 SDD。

## 开发约定

- 所有文本文件保持 UTF-8。
- 前端、后端、网关、MCP、观测模块保持独立可运行。
- 前后端或网关整合前，先定义契约。
- 当前基线中 Higress 只负责路由，鉴权和权限判断由 Kratos 负责。
- Prometheus 和 Grafana 保持可选，不作为小项目默认必选依赖。
- 不提交本地运行数据、日志、`node_modules`、构建产物或嵌套上游仓库。
