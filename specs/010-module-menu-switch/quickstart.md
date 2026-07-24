# Quickstart: 模块切换与菜单分组

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
2. 确认右上角模块选择器显示 `系统设置`。
3. 确认左侧导航显示当前模块下的授权菜单。
4. 打开 `系统管理 / 模块管理`。
5. 创建一个新模块。
6. 打开 `系统管理 / 菜单管理`，把某个菜单分配到新模块。
7. 确认当前角色拥有该菜单权限后，刷新 currentUser 或重新登录，右上角能看到新模块。
8. 切换模块后确认左侧导航随模块变化。
9. 使用 `user / ant.design` 登录，确认只显示包含授权菜单的模块。
10. 通过网关入口 `http://localhost:18080` 重复核心路径验证。
