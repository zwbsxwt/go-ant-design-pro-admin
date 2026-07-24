# Feature Specification: Personal Center And Password Settings

**Feature Branch**: `008-profile-settings`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "缺少个人中心，修改名称、密码等功能；头像文件先不做，后续整合 S3 协议再说。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 查看个人中心 (Priority: P1)

登录用户需要从右上角用户菜单进入个人中心，查看自己的账号信息、角色、联系信息和当前可编辑资料。

**Why this priority**: 个人中心是后续修改资料和密码的入口，没有入口就无法形成完整用户自服务闭环。

**Independent Test**: 使用 `admin / ant.design` 登录后，从头像下拉菜单进入个人中心，页面展示当前用户的用户名、显示名、邮箱、手机、角色和账号状态。

**Acceptance Scenarios**:

1. **Given** 用户已登录，**When** 点击右上角头像菜单中的“个人中心”，**Then** 系统打开个人中心页面并显示当前登录用户资料。
2. **Given** 用户未登录，**When** 直接访问个人中心页面，**Then** 系统跳转到登录页。
3. **Given** 普通 `user` 用户已登录，**When** 进入个人中心，**Then** 只能看到自己的资料，不能看到用户管理列表或其它用户资料。

---

### User Story 2 - 修改个人资料 (Priority: P1)

登录用户需要修改自己的显示名称、邮箱和手机号，保存后页面和当前用户信息同步更新。

**Why this priority**: 显示名和联系方式是后台账号的基础自服务能力，应避免所有资料修改都依赖管理员。

**Independent Test**: 登录用户在个人中心修改显示名、邮箱或手机号，保存成功后刷新页面，个人中心和右上角用户信息反映最新值。

**Acceptance Scenarios**:

1. **Given** 用户已登录并打开个人中心，**When** 修改显示名并保存，**Then** 系统保存新显示名并刷新当前用户信息。
2. **Given** 用户输入非法邮箱，**When** 点击保存，**Then** 系统阻止提交并提示邮箱格式错误。
3. **Given** 用户输入超长显示名或手机号，**When** 点击保存，**Then** 系统阻止提交并展示字段校验提示。
4. **Given** 用户尝试修改用户名、角色、状态或权限，**When** 提交请求，**Then** 系统不允许这些字段通过个人中心变更。

---

### User Story 3 - 修改登录密码 (Priority: P1)

登录用户需要在个人中心输入当前密码、新密码和确认密码来修改自己的登录密码。

**Why this priority**: 密码自助修改是后台管理系统的基础安全能力，且不同于管理员重置密码，必须验证当前密码。

**Independent Test**: 登录用户输入正确当前密码和符合规则的新密码后保存，旧密码失效，新密码可登录。

**Acceptance Scenarios**:

1. **Given** 用户已登录，**When** 输入正确当前密码、新密码和确认密码并保存，**Then** 系统修改密码并提示重新登录。
2. **Given** 用户输入错误当前密码，**When** 提交修改密码，**Then** 系统拒绝修改并提示当前密码错误。
3. **Given** 新密码和确认密码不一致，**When** 提交修改密码，**Then** 系统在前端阻止提交。
4. **Given** 新密码少于 6 位，**When** 提交修改密码，**Then** 系统拒绝修改并提示密码规则。
5. **Given** 密码修改成功，**When** 使用旧密码重新登录，**Then** 登录失败；**When** 使用新密码登录，**Then** 登录成功。

### Edge Cases

- 当前用户账号被禁用后访问个人中心，应按当前登录态规则失效或拒绝访问。
- 修改资料时邮箱或手机号为空：邮箱和手机号允许为空，但若填写必须符合格式和长度规则。
- 密码修改成功后已有 token 是否继续有效：本 feature 默认撤销当前 token 并要求重新登录。
- 头像字段只显示当前头像 URL 或默认头像，不提供上传、裁剪、删除、对象存储配置。
- 用户不能通过个人中心提升自己的角色、状态、菜单权限或按钮权限。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a personal center entry from the signed-in user's avatar dropdown.
- **FR-002**: System MUST provide a personal center page for the current signed-in user.
- **FR-003**: System MUST display username, display name, avatar preview, email, phone, role codes, and account status in the personal center.
- **FR-004**: Users MUST be able to update their own display name, email, and phone.
- **FR-005**: System MUST validate display name length before saving.
- **FR-006**: System MUST validate email format when email is provided.
- **FR-007**: System MUST validate phone length and basic numeric formatting when phone is provided.
- **FR-008**: System MUST NOT allow users to update username, roles, status, avatar file, menu permissions, or button permissions from personal center.
- **FR-009**: Users MUST be able to change their own password by providing current password, new password, and password confirmation.
- **FR-010**: System MUST verify the current password before changing password.
- **FR-011**: System MUST reject new passwords shorter than 6 characters.
- **FR-012**: System MUST invalidate the current login token after a successful password change and guide the user to log in again.
- **FR-013**: System MUST keep administrator user-management reset-password behavior separate from personal password change behavior.
- **FR-014**: System MUST return user-friendly error messages for invalid current password, invalid field format, unauthorized access, and expired login state.
- **FR-015**: System MUST keep all personal center text and documentation as UTF-8 Chinese where user-facing Chinese is introduced.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server/`, `web/`, `specs/`, optionally `docs/` if developer guidance needs an update.
- **Out of Scope**: `gateway/`, `mcp/`, `prometheus/`, `grafana/`, `deploy/`.
- **Optional Runtime Impact**: No new optional runtime dependency. Prometheus, Grafana, MCP, and object storage remain optional and untouched.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **Current User Profile**: The editable subset of the signed-in user's account data: display name, email, phone, avatar preview, username, role codes, and status.
- **Password Change Request**: A user-initiated security operation containing current password, new password, and confirmation.
- **Session Token**: The current login credential that should be revoked after a successful password change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user can navigate to personal center from the avatar menu in under 2 clicks.
- **SC-002**: A signed-in user can update display name, email, or phone and see the new value after refresh within one normal page reload.
- **SC-003**: 100% of password changes require the correct current password.
- **SC-004**: After password change, the old password fails login and the new password succeeds.
- **SC-005**: Users cannot modify roles, status, permissions, or other users' profiles through personal center.
- **SC-006**: The feature can be verified through direct frontend/backend access and through the Higress gateway without adding new deployment dependencies.

## Assumptions

- Existing login token, currentUser, MySQL user table, and Redis token store will be reused.
- Personal center does not require a new database table.
- Avatar upload, image storage, object storage, S3-compatible protocol, CDN, and file permission policy are intentionally deferred to a future feature.
- Display name, email, and phone remain simple account fields, not an extended employee profile.
- Password complexity remains the current minimum of 6 characters unless a later security spec tightens it.
