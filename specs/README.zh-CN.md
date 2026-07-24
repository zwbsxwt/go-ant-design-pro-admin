# SDD 工作台

本目录是项目的 Spec Kit / SDD 工作区，用来承载需求、计划、任务、接口契约、验证说明和技术决策记录。

如果要把 SDD 内容通过 Git 同步到外部系统展示，建议优先展示本文档，再跳转到每个 feature 的 `spec.md`、`plan.md`、`tasks.md` 和 `quickstart.md`。

## 当前状态

| 编号 | 功能 | 状态 | 需求 | 任务 | 验证 |
| --- | --- | --- | --- | --- | --- |
| `000` | Bootstrap 跑通记录 | 已完成 | - | - | [research.md](000-bootstrap/research.md) |
| `001` | 最小登录整合闭环 | 已完成 | [spec.md](001-min-login-integration/spec.md) | [tasks.md](001-min-login-integration/tasks.md) | [quickstart.md](001-min-login-integration/quickstart.md) |
| `002` | 后台品牌和登录 UI | 已完成 | [spec.md](002-admin-branding-login-ui/spec.md) | [tasks.md](002-admin-branding-login-ui/tasks.md) | [quickstart.md](002-admin-branding-login-ui/quickstart.md) |
| `003` | MySQL / Redis 数据底座 | 已完成 | [spec.md](003-system-data-foundation/spec.md) | [tasks.md](003-system-data-foundation/tasks.md) | [quickstart.md](003-system-data-foundation/quickstart.md) |
| `004` | 菜单管理 | 已完成 | [spec.md](004-system-menu-management/spec.md) | [tasks.md](004-system-menu-management/tasks.md) | [quickstart.md](004-system-menu-management/quickstart.md) |
| `005` | 角色管理 | 已完成 | [spec.md](005-system-role-management/spec.md) | [tasks.md](005-system-role-management/tasks.md) | [quickstart.md](005-system-role-management/quickstart.md) |
| `006` | 用户管理 | 已完成 | [spec.md](006-system-user-management/spec.md) | [tasks.md](006-system-user-management/tasks.md) | [quickstart.md](006-system-user-management/quickstart.md) |
| `007` | 动态菜单联动与中文菜单 | 已完成 | [spec.md](007-dynamic-menu-linkage/spec.md) | [tasks.md](007-dynamic-menu-linkage/tasks.md) | [quickstart.md](007-dynamic-menu-linkage/quickstart.md) |
| `008` | 个人中心与密码设置 | 已完成 | [spec.md](008-profile-settings/spec.md) | [tasks.md](008-profile-settings/tasks.md) | [quickstart.md](008-profile-settings/quickstart.md) |
| `009` | RustFS 头像上传与展示 | 已完成 | [spec.md](009-avatar-upload-rustfs/spec.md) | [tasks.md](009-avatar-upload-rustfs/tasks.md) | [quickstart.md](009-avatar-upload-rustfs/quickstart.md) |
| `010` | 模块切换与菜单分组 | 已完成 | [spec.md](010-module-menu-switch/spec.md) | [tasks.md](010-module-menu-switch/tasks.md) | [quickstart.md](010-module-menu-switch/quickstart.md) |
| `011` | 模块与菜单管理体验优化 | 已完成 | [spec.md](011-module-menu-ux-optimization/spec.md) | [tasks.md](011-module-menu-ux-optimization/tasks.md) | [quickstart.md](011-module-menu-ux-optimization/quickstart.md) |
| `012` | 模板初始化与品牌配置整理 | 已完成 | [spec.md](012-template-initialization-polish/spec.md) | [tasks.md](012-template-initialization-polish/tasks.md) | [quickstart.md](012-template-initialization-polish/quickstart.md) |

## 文件含义

| 文件 | 含义 | 用途 |
| --- | --- | --- |
| `spec.md` | 需求规格 | 描述用户场景、验收标准、边界和成功指标 |
| `plan.md` | 实施计划 | 描述技术方案、模块范围、架构决策和复杂度 |
| `tasks.md` | 任务清单 | 拆分可执行任务，用 `[ ]` / `[x]` 表示进度 |
| `quickstart.md` | 验证说明 | 记录如何启动、如何验证、预期结果 |
| `research.md` | 决策记录 | 记录方案取舍、风险、调研结论和变更说明 |
| `data-model.md` | 数据模型 | 描述实体、字段、关系和校验规则 |
| `contracts/` | 契约目录 | 存放 API、前端、网关或部署契约 |
| `checklists/` | 检查清单 | 存放需求质量、验收质量等检查结果 |

`000-bootstrap/` 是例外。它不是正式产品 feature，而是记录组件跑通、端口、命令、资源占用和风险的 bootstrap spike。

## 当前基础能力

- Ant Design Pro 登录。
- Kratos 当前用户接口。
- Higress `/api/*` 路由转发。
- 后台品牌名 `go-ant-design-pro-admin`，名称与描述集中在 `web/config/appConfig.ts`。
- Docker MySQL 和 Redis 本地依赖。
- 数据库种子用户：`admin / ant.design` 和 `user / ant.design`。
- 系统管理 / 菜单管理。
- 系统管理 / 模块管理。
- 系统管理 / 角色管理。
- 系统管理 / 用户管理。
- 角色绑定菜单权限和按钮权限。
- 用户绑定角色。
- `currentUser` 返回角色编码、菜单权限、按钮权限、授权菜单树和授权模块。
- 数据库菜单名称、排序、状态、授权显隐联动左侧菜单。
- 顶部模块 Tab 切换，默认模块为 `系统设置`。
- 模块支持隐藏/显示、启用/禁用、迁移菜单后删除。
- 菜单支持隐藏/显示、启用/禁用、模块筛选和批量迁移模块。
- 个人中心与密码设置。
- RustFS/S3 头像上传与展示。

## 推荐展示方式

如果后续做 Git 同步和任务可视化，可以按这个优先级读取：

1. 展示 [本文档](README.zh-CN.md) 作为 SDD 首页。
2. 用每个 feature 的 `tasks.md` 生成任务进度。
3. 用每个 feature 的 `spec.md` 展示需求详情。
4. 用 `quickstart.md` 展示验证步骤。
5. 用 `research.md` 展示技术决策和变更原因。

任务进度可以直接从 `tasks.md` 解析：

```text
- [ ] 未完成任务
- [x] 已完成任务
```

## 需求变更规则

SDD 中的需求变更以“当前有效规格”为准，不建议手动保留大量旧版本文件。旧版本交给 Git 历史保存。

| 变更类型 | 处理方式 |
| --- | --- |
| 小改动，例如文案、展示字段 | 更新现有 feature 的 `spec.md` / `tasks.md` |
| 中等改动，例如新增字段、调整接口 | 更新现有 feature，并在 `research.md` 或 `plan.md` 写变更说明 |
| 大改动，例如权限模型重构、JWT 网关鉴权 | 新建新的 feature 目录 |

## SDD 工作边界

以下工作必须走完整 SDD：

- 登录、当前用户、菜单权限、按钮权限。
- 前后端 API 契约变化。
- 数据库结构和种子数据变化。
- Higress 路由变化。
- Redis、鉴权、审计、监控告警等架构能力。
- MCP 服务接入主流程。
- 任何影响部署边界或模块职责的变更。

以下工作可以轻量处理：

- 单组件能否运行的 bootstrap spike。
- 小的文档修正。
- 不改变行为的格式修复。

## 相关入口

- 项目总说明：[../README.zh-CN.md](../README.zh-CN.md)
- 项目规则：[../AGENTS.md](../AGENTS.md)
- SDD 宪法：[../.specify/memory/constitution.md](../.specify/memory/constitution.md)
- Spec Kit 使用指南：[../spec-kit-skill/SKILL.md](../spec-kit-skill/SKILL.md)
- Spec Kit 工作流：[../spec-kit-skill/references/spec-kit-workflows.md](../spec-kit-skill/references/spec-kit-workflows.md)
