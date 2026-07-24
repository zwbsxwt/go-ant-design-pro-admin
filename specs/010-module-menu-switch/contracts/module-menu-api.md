# Contract: 模块菜单 API

## 模块管理

### `GET /api/system/modules`

返回模块列表，供管理员维护模块基础信息。

### `POST /api/system/modules`

创建模块。

必填字段：`code`、`name`。

### `PUT /api/system/modules/{id}`

更新模块编码、名称、图标、排序和状态。

### `DELETE /api/system/modules/{id}`

仅当模块下没有菜单挂载时允许删除。

## 菜单管理扩展

`Menu` 新增字段：

```json
{
  "module_id": "module-system"
}
```

创建和更新菜单时接受 `module_id`。如果调用方没有传值，后端默认使用 `module-system`。

## 当前用户扩展

`GET /api/currentUser` 新增：

```json
{
  "data": {
    "modules": [
      {
        "id": "module-system",
        "code": "system",
        "name": "系统设置",
        "icon": "SettingOutlined",
        "sort": 10,
        "status": "ACTIVE"
      }
    ],
    "menus": [
      {
        "id": "menu-system",
        "module_id": "module-system"
      }
    ]
  }
}
```

## 前端契约

- 右上角模块选择器读取 `currentUser.modules`。
- 左侧菜单只渲染 `module_id` 等于当前选中模块 ID 的授权菜单。
- 如果本地记住的模块不可用，前端回退到第一个授权模块。
- 静态路由和组件白名单仍然是最终页面注册来源。
