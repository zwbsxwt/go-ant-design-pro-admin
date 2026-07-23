# Contract: Current User Menu Tree

## Endpoint

```text
GET /api/currentUser
```

## Added Payload

The response `data` object includes `menus`:

```json
{
  "data": {
    "menus": [
      {
        "id": "menu-system",
        "parent_id": "",
        "type": "directory",
        "name": "系统管理",
        "path": "/system",
        "component": "",
        "permission_code": "menu.system",
        "icon": "SettingOutlined",
        "sort": 30,
        "status": "ACTIVE",
        "children": []
      }
    ]
  }
}
```

## Semantics

- `menus` contains authorized `directory` and `page` resources only.
- Button resources remain in `button_permissions`.
- Disabled roles and disabled menus do not grant menu tree entries.
- The frontend may ignore menu entries that do not map to known static routes.

## Compatibility

Existing fields remain unchanged:

- `role_codes`
- `menu_permissions`
- `button_permissions`
