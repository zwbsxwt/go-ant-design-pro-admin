# Implementation Plan: 模板初始化与品牌配置整理

## Technical Approach

- 前端采用配置文件优先方案，在 `web/config/appConfig.ts` 暴露模板名称和描述。
- 登录页直接使用配置值和中文通用 placeholder，避免 i18n 文案残留泄露默认账号。
- MySQL Docker 初始化通过挂载后端同一套 SQL 文件实现，避免维护两份脚本。
- README 作为新人启动入口，明确账号、初始化机制和重置本地数据库方法。

## Key Decisions

- 不引入环境变量覆盖，保持模板简单。
- 不修改默认种子密码，避免破坏既有 smoke test 和文档。
- Docker 初始化和后端初始化双路径并存：Docker 负责空库首次启动，后端负责幂等升级和修复。

## Affected Areas

- `web/config/appConfig.ts`
- 登录页、页脚、Welcome/Admin 示例页、Umi 配置和 ProLayout 默认设置
- `deploy/docker-compose.local.yml`
- `README.md`、`README.zh-CN.md`、`deploy/README.md`
- `server/admin-service/internal/data/migrations/` 和 `seeds/`
