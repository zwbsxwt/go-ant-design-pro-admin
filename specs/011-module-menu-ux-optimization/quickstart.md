# Quickstart: 模块与菜单管理体验优化

## Backend

```powershell
cd server/admin-service
go test ./...
go build -o ./bin/ ./cmd/admin-service
```

## Frontend

```powershell
cd web
npm run lint
npm run test
npm run build
```

## Manual Checks

1. 使用 `admin / ant.design` 登录。
2. 确认右上角模块以平铺标签形式显示。
3. 在模块管理页隐藏 `系统设置` 以外的新模块，确认右上角不显示该模块。
4. 在菜单管理页隐藏某个页面菜单，确认左侧不显示但直接访问仍可进入。
5. 禁用某个页面菜单，确认左侧不显示且直接访问无权限。
6. 创建两个模块和菜单，批量迁移菜单到目标模块。
7. 删除非空模块时选择目标模块，确认菜单迁移后模块删除。

## Smoke Command Used

```powershell
# 使用 admin 登录后创建临时模块和菜单，验证批量迁移、迁移删除，再清理临时数据。
```
