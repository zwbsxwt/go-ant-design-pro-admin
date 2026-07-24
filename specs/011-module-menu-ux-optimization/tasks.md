# Tasks: 模块与菜单管理体验优化

## Phase 1: SDD

- [x] T001 新建 011 SDD 文档目录和核心文档
- [x] T002 更新 `.specify/feature.json` 指向 011

## Phase 2: Backend

- [x] T003 扩展 module/menu/currentUser protobuf 字段与迁移接口
- [x] T004 生成 Kratos HTTP/gRPC/OpenAPI 代码
- [x] T005 为 `system_modules` 和 `system_menus` 增加 `hidden` schema 兼容迁移
- [x] T006 实现模块隐藏字段读写、删除迁移接口和安全校验
- [x] T007 实现菜单隐藏字段读写和批量迁移接口
- [x] T008 调整 currentUser 模块/菜单查询语义

## Phase 3: Frontend

- [x] T009 将右上角模块切换改为平铺标签式交互
- [x] T010 增强模块管理页：隐藏/显示、删除迁移、中文 UTF-8
- [x] T011 增强菜单管理页：隐藏/显示、模块筛选、批量迁移、中文 UTF-8
- [x] T012 扩展前端类型和 system 服务
- [x] T013 调整左侧菜单渲染过滤 hidden

## Phase 4: Validation

- [x] T014 Run `go test ./...`
- [x] T015 Run `go build -o ./bin/ ./cmd/admin-service`
- [x] T016 Run `npm run lint`
- [x] T017 Run `npm run test`
- [x] T018 Run `npm run build`
- [x] T019 Smoke 模块隐藏、菜单隐藏、模块迁移删除、菜单批量迁移
- [x] T020 更新 SDD 状态和任务勾选
