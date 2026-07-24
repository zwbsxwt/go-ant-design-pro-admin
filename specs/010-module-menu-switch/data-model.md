# Data Model: 模块切换与菜单分组

## Entity: Module

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | 稳定 ID，例如 `module-system` |
| `code` | string | yes | 唯一稳定编码，例如 `system` |
| `name` | string | yes | 展示名，例如 `系统设置` |
| `icon` | string | no | Ant Design 图标白名单 key |
| `sort` | integer | yes | 模块选择器排序 |
| `status` | string | yes | `ACTIVE` 或 `DISABLED` |
| `created_at` | datetime | yes | 创建时间 |
| `updated_at` | datetime | yes | 更新时间 |

## Entity: Menu Resource

现有菜单实体新增：

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `module_id` | string | yes | 所属模块 ID |

## Entity: Current User Module

当前用户可见模块投影。

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | 模块 ID |
| `code` | string | yes | 模块编码 |
| `name` | string | yes | 模块展示名 |
| `icon` | string | no | 图标 key |
| `sort` | integer | yes | 展示排序 |
| `status` | string | yes | 只返回启用模块 |

## Relationships

- 一个模块有多个菜单。
- 一个菜单只能属于一个模块。
- 当前用户通过角色菜单授权间接拥有可见模块。
