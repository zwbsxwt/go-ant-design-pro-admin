# Implementation Plan: 模块与菜单管理体验优化

## Summary

在现有模块菜单联动基础上，增加模块/菜单 `hidden` 展示控制、模块删除迁移、菜单批量迁移，并将右上角模块切换从下拉改为平铺标签。

## Technical Context

- Backend: Kratos protobuf-first Go service。
- Frontend: Ant Design Pro / Umi Max / ProComponents。
- Storage: MySQL 新增 `system_modules.hidden` 和 `system_menus.hidden`。
- Compatibility: 已有数据默认 `hidden = false`，启动时自动补列。

## Implementation Notes

- 后端 proto 新增 `hidden` 字段和迁移接口后运行 `buf generate --template buf.gen.yaml`。
- `system_modules.hidden` 和 `system_menus.hidden` 通过启动兼容迁移补列。
- `currentUser.modules` 过滤 `system_modules.status = ACTIVE AND hidden = false`。
- `currentUser.menus` 保留隐藏菜单用于权限判断，但不返回禁用菜单或禁用模块下菜单。
- 前端左侧菜单渲染时过滤隐藏菜单。
- 普通 `DELETE /api/system/modules/{id}` 仍阻止非空模块；非空删除使用迁移接口完成。

## Validation

- `go test ./...`
- `go build -o ./bin/ ./cmd/admin-service`
- `npm run lint`
- `npm run test`
- `npm run build`
- Smoke: 登录、currentUser、隐藏字段、菜单批量迁移、模块迁移删除。
