# Feature Specification: Module Menu Switch

**Feature Branch**: `010-module-menu-switch`

**Created**: 2026-07-23

**Status**: Completed

**Input**: User description: "我要在右上角加入模块，当前默认是系统设置这个模块，和菜单联动，新增模块，模块下挂具体菜单，这样业务好区分。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 切换当前业务模块 (Priority: P1)

已登录用户需要在后台右上角看到当前模块，默认模块为“系统设置”，并能切换到自己有权限访问的其它模块。

**Why this priority**: 后台菜单会随着业务增长变多，仅靠左侧菜单会混杂系统配置和业务功能。模块切换可以先按业务域分组，再在左侧显示该模块内菜单，降低用户寻找功能的成本。

**Independent Test**: 使用 `admin / ant.design` 登录后，右上角显示“系统设置”；当存在其它授权模块时，可以切换模块，左侧菜单随之刷新。

**Acceptance Scenarios**:

1. **Given** 用户首次登录后台，**When** 页面加载完成，**Then** 右上角模块选择显示默认模块“系统设置”。
2. **Given** 用户拥有多个模块的授权菜单，**When** 点击右上角模块选择并切换模块，**Then** 左侧菜单只显示当前模块下的授权菜单。
3. **Given** 用户只拥有一个模块的授权菜单，**When** 打开后台，**Then** 右上角仍显示当前模块，但不会误导用户进入无权限模块。

---

### User Story 2 - 模块与菜单真实联动 (Priority: P1)

管理员需要把菜单挂到某个模块下，用户切换模块时，系统按模块过滤菜单树。

**Why this priority**: 模块不是单纯前端静态分组，而应与数据库菜单资源和权限体系联动，保证菜单管理、角色授权、currentUser 和左侧导航看到的是同一套结构。

**Independent Test**: 管理员新增一个模块并把页面菜单挂到该模块下，给角色授权后，用户登录并切换到该模块时能看到对应菜单。

**Acceptance Scenarios**:

1. **Given** 管理员创建一个新模块，**When** 在菜单管理中把页面菜单挂到该模块，**Then** 该菜单归属于新模块。
2. **Given** 某个角色只授权了一个模块下的部分菜单，**When** 用户登录，**Then** 右上角只出现包含授权菜单的模块，左侧只显示该模块下已授权菜单。
3. **Given** 菜单被移动到其它模块，**When** 用户刷新 currentUser 或重新登录，**Then** 左侧菜单根据新的模块归属展示。

---

### User Story 3 - 管理模块基础信息 (Priority: P2)

管理员需要维护模块名称、编码、图标、排序和状态，并能控制模块是否启用。

**Why this priority**: 模块会随着业务线变化而变化，不能只靠硬编码。后台模板需要提供可维护的模块资源，方便后续业务扩展。

**Independent Test**: 管理员新增、编辑、禁用模块后，右上角模块列表和菜单管理归属选择随之变化。

**Acceptance Scenarios**:

1. **Given** 管理员新增模块并设置排序，**When** 用户有该模块下菜单权限，**Then** 右上角模块列表按排序展示该模块。
2. **Given** 管理员禁用模块，**When** 用户刷新后台，**Then** 该模块不再出现在右上角模块选择中，其下菜单也不出现在左侧。
3. **Given** 管理员尝试删除仍挂有菜单的模块，**When** 提交删除，**Then** 系统拒绝删除并提示先迁移或删除下属菜单。

### Edge Cases

- 当前选中模块被禁用或失去权限后，系统应自动切回用户可访问的第一个模块；如果没有任何可访问模块，则显示空菜单和可理解的提示。
- 数据库存在模块但没有任何授权菜单时，该模块不应展示给普通用户。
- 数据库菜单存在但未绑定模块时，应归入默认“系统设置”或被迁移脚本补齐，避免菜单消失。
- 模块编码应保持稳定，不随中文名称变化而变化。
- 管理员自己禁用“系统设置”或移除关键系统菜单授权时，应受到后端保护或至少保留可恢复路径。
- 前端仍不能因为数据库模块配置而加载未知页面组件；页面组件白名单规则继续有效。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a top-right current module selector for signed-in users.
- **FR-002**: System MUST seed a default module named `系统设置`.
- **FR-003**: System MUST associate each menu resource with exactly one module.
- **FR-004**: System MUST allow administrators to create, update, enable, disable, and delete modules subject to safety rules.
- **FR-005**: System MUST prevent deleting a module that still has menus attached.
- **FR-006**: System MUST expose the signed-in user's authorized module list through current user data.
- **FR-007**: Authorized module list MUST include only enabled modules that contain at least one enabled authorized directory or page menu.
- **FR-008**: Left navigation MUST render menus for the currently selected module only.
- **FR-009**: Switching modules MUST update the left navigation without requiring full logout.
- **FR-010**: The user's selected module SHOULD persist across page refreshes when still authorized.
- **FR-011**: If the selected module is no longer authorized or enabled, system MUST fall back to the first available authorized module.
- **FR-012**: Menu Management MUST allow assigning menus to modules.
- **FR-013**: Role permissions MUST remain menu/button based; modules group menus but do not replace role-menu permission binding.
- **FR-014**: Permission codes MUST remain stable and independent from module names.
- **FR-015**: Frontend route/component whitelist safety from dynamic menu linkage MUST remain in effect.
- **FR-016**: Higress MUST remain routing-only for this feature.
- **FR-017**: All Chinese UI text and SDD documents MUST remain UTF-8.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server/`, `web/`, `specs/`, seed data, currentUser contract, menu management, role-authorized menu rendering.
- **Out of Scope**: Higress authentication, dynamic remote frontend modules, micro-frontend runtime loading, MCP, Prometheus, Grafana.
- **Optional Runtime Impact**: No new runtime dependency.
- **UTF-8 Impact**: New module names and UI text are Chinese and must be stored and rendered as UTF-8.

### Key Entities *(include if feature involves data)*

- **Module**: A top-level business grouping with id, code, name, icon, sort, status, created/updated time.
- **Menu Resource**: Existing directory/page/button resource extended with module ownership or module association.
- **Authorized Module**: A module visible to the current user because the user has at least one enabled authorized menu under it.
- **Current Module Selection**: The frontend state representing which authorized module currently drives the left navigation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On first login, a user sees “系统设置” as the current module when no other module is selected.
- **SC-002**: A user with multiple authorized modules can switch modules in no more than 2 clicks.
- **SC-003**: After switching modules, 100% of left navigation items belong to the selected module and the user's authorized menus.
- **SC-004**: Disabled modules and modules without authorized menus are not shown to ordinary users.
- **SC-005**: Administrators can create a new module, attach menus to it, grant those menus to a role, and verify the module appears for that role.
- **SC-006**: Existing system management menus remain reachable under “系统设置” after migration.
- **SC-007**: The feature can be verified without adding new infrastructure or changing Higress auth behavior.

## Assumptions

- “模块”是后台菜单之上的业务域分组，不是微前端应用，也不负责动态加载远程页面。
- 默认模块使用中文名称“系统设置”，稳定编码建议为 `system`.
- 现有系统管理、欢迎页、管理页等内置菜单默认迁移到“系统设置”。
- 模块权限通过模块下的菜单权限间接决定；本期不新增单独的“模块权限”绑定表作为用户可见权限模型。
- 前端仍使用静态路由和组件白名单，数据库只控制模块、菜单名称、排序、状态和授权显隐。
- 当前模块选择可以存储在浏览器本地状态；后续如需跨设备记忆再单独开 spec。
