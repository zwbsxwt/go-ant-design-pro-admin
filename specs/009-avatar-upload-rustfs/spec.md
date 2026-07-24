# Feature Specification: RustFS Avatar Upload And Display

**Feature Branch**: `009-avatar-upload-rustfs`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "搭建了一个 RustFS / S3 兼容对象存储服务器，写一个 Spec Kit 实现头像上传和展示。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 上传个人头像 (Priority: P1)

已登录用户需要在个人中心上传自己的头像图片，上传成功后个人中心立即展示新头像。

**Why this priority**: 头像是个人中心的基础体验，当前 008 已完成个人资料和密码修改，本 feature 补齐此前明确延后的头像能力。

**Independent Test**: 使用 `admin / ant.design` 登录，进入个人中心，上传一张合规图片，页面显示上传成功并展示新头像。

**Acceptance Scenarios**:

1. **Given** 用户已登录并打开个人中心，**When** 选择一张小于限制的 PNG、JPEG 或 WebP 图片上传，**Then** 系统保存头像并在个人中心展示新头像。
2. **Given** 用户未登录，**When** 调用头像上传能力，**Then** 系统拒绝上传并要求登录。
3. **Given** 用户上传非图片文件，**When** 提交上传，**Then** 系统拒绝文件并提示格式不支持。
4. **Given** 用户上传超过大小限制的图片，**When** 提交上传，**Then** 系统拒绝文件并提示文件过大。

---

### User Story 2 - 全局展示当前头像 (Priority: P1)

已登录用户上传头像后，需要在右上角头像下拉、个人中心、当前用户信息中看到一致的新头像。

**Why this priority**: 头像上传只有在全局用户信息中同步展示，才算形成完整闭环。

**Independent Test**: 上传头像后刷新页面，右上角头像和个人中心头像仍显示同一个最新头像。

**Acceptance Scenarios**:

1. **Given** 用户已上传头像，**When** 刷新后台页面，**Then** 右上角头像展示最新头像。
2. **Given** 用户已上传头像，**When** 调用当前用户信息，**Then** 返回结果包含最新头像地址。
3. **Given** 对象存储临时不可访问，**When** 页面加载头像失败，**Then** 页面保留默认头像或降级展示，不影响登录和菜单。

---

### User Story 3 - 管理员查看用户头像 (Priority: P2)

管理员需要在用户管理或用户详情中看到用户当前头像，便于识别账号，但本期不提供管理员代替用户上传头像。

**Why this priority**: 用户管理已是基础模块，头像字段应在管理场景中可读，但代上传涉及审计和权限边界，可后续扩展。

**Independent Test**: 管理员打开用户管理，已上传头像的用户显示头像预览。

**Acceptance Scenarios**:

1. **Given** 管理员打开用户管理页面，**When** 某个用户已有头像，**Then** 列表或详情展示该头像。
2. **Given** 普通用户打开个人中心，**When** 查看头像，**Then** 只能修改自己的头像，不能修改其他用户头像。

### Edge Cases

- 对象存储配置缺失时，头像上传入口应给出可理解的错误，不影响个人资料和密码修改。
- RustFS bucket 不存在或权限不足时，上传应失败并提示存储不可用。
- 上传成功但数据库更新失败时，系统应返回失败并避免展示未绑定到用户的头像地址。
- 同一用户多次上传头像时，最新头像应覆盖用户资料中的头像引用；旧对象清理由后续独立 spec 处理。
- 头像 URL 不应包含访问密钥、Secret Key 或临时敏感参数。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an avatar upload entry in the personal center for the signed-in user.
- **FR-002**: System MUST accept avatar files only from authenticated users.
- **FR-003**: System MUST support PNG, JPEG, and WebP avatar images.
- **FR-004**: System MUST reject unsupported file types before storing them.
- **FR-005**: System MUST enforce a maximum avatar file size of 2 MB.
- **FR-006**: System MUST store avatar objects in the configured object storage bucket.
- **FR-007**: System MUST update the current user's avatar field after successful object storage upload.
- **FR-008**: System MUST return the latest avatar address from personal profile and current user responses.
- **FR-009**: System MUST display the latest avatar in personal center and the top-right user avatar area.
- **FR-010**: System MUST keep object storage credentials out of Git and source files.
- **FR-011**: System MUST provide clear user-facing errors for unauthenticated access, invalid file type, oversized file, storage unavailable, and save failure.
- **FR-012**: System MUST NOT allow a user to upload or overwrite another user's avatar through the personal center.
- **FR-013**: System MUST keep Higress limited to `/api/*` forwarding; no gateway authentication change is included in this feature.
- **FR-014**: System MUST keep all new Chinese UI text and SDD documents encoded as UTF-8.

### Module Scope *(mandatory for this repository)*

- **In Scope**: `server/`, `web/`, `specs/`, optionally `docs/` and `deploy/` documentation/examples.
- **Out of Scope**: `gateway/` authentication changes, `mcp/`, `prometheus/`, `grafana/`.
- **Optional Runtime Impact**: RustFS/S3-compatible object storage becomes required only when avatar upload is enabled. It is not part of the minimal small-project startup chain.
- **UTF-8 Impact**: All new or modified text artifacts MUST remain UTF-8.

### Key Entities *(include if feature involves data)*

- **Avatar Object**: The uploaded image stored in RustFS/S3-compatible storage with bucket, object key, content type, size, and public display URL.
- **Current User Profile**: Existing signed-in user profile extended by the latest avatar URL.
- **Object Storage Configuration**: Runtime configuration containing endpoint, region, bucket, force path style, access key, secret key, and optional public base URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user can upload a valid avatar from personal center in one form interaction.
- **SC-002**: 100% of unsupported file types and files over 2 MB are rejected before becoming the user's visible avatar.
- **SC-003**: After successful upload, refreshing the page shows the new avatar in personal center and top-right user area.
- **SC-004**: Avatar upload failure does not break login, currentUser, menu rendering, profile editing, or password changing.
- **SC-005**: No access key, secret key, or private token is committed to repository text files.
- **SC-006**: The feature can be validated through direct frontend/backend access and through the Higress gateway without adding Grafana, Prometheus, or MCP to the default runtime.

## Assumptions

- RustFS is used through its S3-compatible API with path-style access and `us-east-1` region.
- The bucket is named `go-ant-design-pro-admin` by default and is created/configured outside this feature unless a later task explicitly adds bucket bootstrap tooling.
- Avatar objects are browser-readable through a configured public object URL or public base URL.
- The existing `system_users.avatar` field is reused; no new database table is required for the first version.
- Cropping, deleting old avatars, audit logs, CDN, signed URL proxying, image moderation, and S3 lifecycle policies are deferred to later specs.
