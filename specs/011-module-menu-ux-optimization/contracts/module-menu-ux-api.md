# Contract: 模块与菜单体验优化 API

## Module

`Module` 新增：

```json
{
  "hidden": false
}
```

`CreateModuleRequest` 和 `UpdateModuleRequest` 接受 `hidden`。

## Menu

`Menu` 新增：

```json
{
  "hidden": false
}
```

`CreateMenuRequest` 和 `UpdateMenuRequest` 接受 `hidden`。

## Migrate Module Menus

`POST /api/system/modules/{id}/migrate-menus`

```json
{
  "target_module_id": "module-target"
}
```

返回迁移后的源模块删除结果：

```json
{
  "success": true
}
```

## Batch Migrate Menus

`POST /api/system/menus/batch-migrate-module`

```json
{
  "menu_ids": ["menu-a", "menu-b"],
  "target_module_id": "module-target"
}
```

返回：

```json
{
  "success": true
}
```

## Current User

- `modules` 只返回启用且未隐藏模块。
- `menus` 不返回禁用菜单或禁用模块下菜单。
- 隐藏菜单仍可在 currentUser 菜单树中返回，前端左侧菜单渲染时过滤。
