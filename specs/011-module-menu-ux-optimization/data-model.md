# Data Model: 模块与菜单管理体验优化

## Module

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `hidden` | bool | yes | 是否从右上角模块切换入口隐藏 |

## Menu

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `hidden` | bool | yes | 是否从左侧导航隐藏 |

## Rules

- `hidden = true` 只影响导航展示。
- `status = DISABLED` 影响可用性。
- 删除非空模块必须先迁移其下菜单到其它启用模块。
- 菜单批量迁移只改变所选菜单的 `module_id`，不改变父子层级、权限编码或角色绑定。
