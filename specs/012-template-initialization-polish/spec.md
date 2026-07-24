# Feature Specification: 模板初始化与品牌配置整理

## Summary

让模板首次使用体验更完整：登录页不暴露默认账号密码，初始账号写入 README；项目名称和描述集中配置；数据库 migration/seed 可被后端和 Docker 首次初始化共同复用。

## User Stories

1. 作为模板使用者，我希望登录页只显示通用的“用户名”“密码”提示，避免把默认账号密码暴露在 UI 中。
2. 作为二次开发者，我希望只修改一个配置文件就能改后台名称和描述。
3. 作为新加入开发者，我希望拉仓库后按 README 启动 MySQL、Redis、后端、前端，就能使用初始账号登录。

## Requirements

- 登录页 placeholder MUST 为 `用户名` 和 `密码`。
- 登录失败提示 MUST 为通用错误，不包含 `admin`、`user`、`ant.design`。
- 初始账号密码 MUST 写入 README 和中文 README。
- 前端产品名称和描述 MUST 集中在 `web/config/appConfig.ts`。
- Docker 本地 MySQL MUST 在空 volume 首次创建时执行 migration 和 seed SQL。
- Kratos 后端 MUST 保留启动时自动执行 embedded SQL 的能力。
- SQL 和文档 MUST 使用 UTF-8。

## Success Criteria

- 新用户按 README 启动后可使用 `admin / ant.design` 登录。
- 修改 `web/config/appConfig.ts` 后，前端标题、登录页、页脚和示例页显示随之变化。
- 登录页源代码和测试不再依赖账号密码提示。
