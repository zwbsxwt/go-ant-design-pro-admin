# Feature Specification: 用户管理头像交互优化

**Feature Branch**: `013-system-user-avatar-ux-polish`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "用户管理创建/编辑弹窗里的头像 URL 交互太奇怪，按 SDD 方式优化。"

## User Scenarios & Testing

### User Story 1 - 管理员创建用户不维护头像 URL (Priority: P1)

管理员创建用户时只填写账号、显示名称、初始密码、联系方式、状态和角色，不需要理解或填写对象存储 URL。

**Independent Test**: 打开创建用户弹窗，确认不存在“头像 URL”输入项，创建用户成功后列表使用默认头像兜底。

### User Story 2 - 管理员编辑用户不破坏已有头像 (Priority: P1)

管理员编辑用户显示名称、邮箱、手机号或状态时，系统必须保留该用户已有头像。

**Independent Test**: 已有头像用户保存编辑资料后，刷新用户列表，头像仍显示原图片。

### User Story 3 - 管理员只查看头像预览 (Priority: P2)

管理员在用户管理列表中可以看到头像预览用于识别账号，但头像上传仍由用户本人在个人中心完成。

**Independent Test**: 用户在个人中心上传头像后，管理员打开用户管理列表可以看到新头像。

## Requirements

- **FR-001**: 用户管理创建弹窗 MUST NOT 展示或提交手填的“头像 URL”字段。
- **FR-002**: 用户管理编辑弹窗 MUST NOT 展示或提交手填的“头像 URL”字段。
- **FR-003**: 用户列表 MUST 继续展示头像列，有头像显示图片，无头像显示显示名称或用户名首字。
- **FR-004**: 编辑用户资料时 MUST 保留该用户原头像，不能因为表单不含头像字段而清空头像。
- **FR-005**: 头像上传入口 MUST 保持在个人中心，不新增管理员代替用户上传头像能力。
- **FR-006**: 本次 MUST NOT 新增后端接口或改变 `/api/system/users` 合同。
- **FR-007**: 所有新增和修改文本 MUST 保持 UTF-8。

## Module Scope

- **In Scope**: `web/`, `specs/`
- **Out of Scope**: `server/` API 变更、数据库结构变更、管理员代上传头像、头像裁剪、删除头像、审计日志、对象存储配置变更

## Success Criteria

- **SC-001**: 创建和编辑用户弹窗中 0 次出现“头像 URL”。
- **SC-002**: 已有头像用户编辑资料后头像保留率为 100%。
- **SC-003**: 用户管理列表头像列继续正常展示。
- **SC-004**: 前端 lint、test、build 全部通过。

## Assumptions

- 头像由用户本人通过 `009-avatar-upload-rustfs` 的个人中心上传能力维护。
- 系统用户 API 暂时仍接受 avatar 字段以兼容已有合同，但前端管理表单不暴露该字段。
- 创建用户默认没有头像。
