# Data Model: Dynamic Menu Linkage

## CurrentUserMenu

- **id**: menu resource id.
- **parent_id**: parent menu id, empty for root.
- **type**: `directory` or `page`.
- **name**: display name used by left navigation.
- **path**: frontend route path.
- **component**: frontend component identifier for whitelist matching.
- **permission_code**: stable permission code.
- **icon**: optional icon name.
- **sort**: display order among siblings.
- **status**: `ACTIVE`.
- **children**: nested authorized menus.

## Rules

- Button menus are not returned in currentUser menu tree.
- Disabled menus are not returned.
- Disabled roles do not grant menus.
- The frontend only renders menus with known route/component mappings.
- Permission codes remain stable and are not translated.
