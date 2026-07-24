# Tasks: 模板初始化与品牌配置整理

## Setup

- [x] T001 新建 012 SDD feature 文档目录。
- [x] T002 检查登录页、品牌配置、README、SQL 初始化和 Docker compose 现状。

## Frontend

- [x] T003 新增统一应用配置 `web/config/appConfig.ts`。
- [x] T004 将默认布局标题和 Umi 标题接入应用配置。
- [x] T005 将登录页标题、描述、placeholder 和错误提示改为模板化安全文案。
- [x] T006 将 Welcome、Admin、Footer 可见品牌文案接入应用配置。
- [x] T007 更新登录页测试，移除账号密码 placeholder 断言。

## Data Initialization

- [x] T008 确认 migration 和 seed SQL 为 UTF-8 中文内容。
- [x] T009 将 SQL 文件挂载到 MySQL `/docker-entrypoint-initdb.d/`。
- [x] T010 保留 Kratos 后端 embedded SQL 初始化路径。

## Documentation

- [x] T011 重写 README 英文说明，补初始账号、数据库初始化和品牌配置说明。
- [x] T012 重写 README 中文说明，补初始账号、数据库初始化和品牌配置说明。
- [x] T013 更新 deploy README 的 MySQL 初始化规则。
- [x] T014 更新 specs 中文索引加入 012。

## Validation

- [x] T015 运行 `cd web && npm run lint`。
- [x] T016 运行 `cd web && npm run test`。
- [x] T017 运行 `cd web && npm run build`。
- [x] T018 运行 `cd server/admin-service && go test ./...`。
- [x] T019 运行 `cd server/admin-service && go build -o ./bin/ ./cmd/admin-service`。
- [x] T020 浏览器验证登录页不展示默认账号密码，admin 登录后 currentUser 和菜单正常。
- [x] T021 提交并 push。
