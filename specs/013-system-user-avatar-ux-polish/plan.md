# Implementation Plan: 用户管理头像交互优化

**Branch**: `013-system-user-avatar-ux-polish` | **Date**: 2026-07-24 | **Spec**: `specs/013-system-user-avatar-ux-polish/spec.md`

## Summary

移除用户管理创建/编辑弹窗中的裸头像 URL 输入，保留列表头像预览。编辑用户时由前端携带原头像值提交，避免现有 `/api/system/users/{id}` 更新合同把缺失头像归一化为空字符串后清空头像。

## Technical Context

- Frontend: Ant Design Pro simple mode, ProTable, ModalForm, ProForm。
- Existing avatar upload: `009-avatar-upload-rustfs` 已提供个人中心上传和展示。
- API: 不新增接口，不变更 protobuf、OpenAPI 或后端服务。
- Encoding: 所有新增文档和中文文案保持 UTF-8。

## Implementation Decisions

- 用户管理只读展示头像，不提供手填 URL。
- 创建用户请求继续发送空头像，后续由用户本人上传。
- 编辑用户请求以 `editingUser.avatar` 作为头像值，防止表单值缺失导致头像被清空。
- 不在用户管理弹窗内嵌上传控件，避免引入管理员代上传权限边界。

## Verification

- `cd web && npm run lint`
- `cd web && npm run test`
- `cd web && npm run build`
- 浏览器验证创建/编辑弹窗不出现“头像 URL”，编辑已有头像用户后头像仍保留。

## Constitution Check

- Spec-first: 本 feature 新增 SDD 文档后再实现。
- Explicit module boundaries: 只改 `web` 与 `specs`，不改变后端、网关或对象存储边界。
- Contract-first APIs: 明确不改变 API 合同。
- Independent runtime verification: quickstart 记录前端和浏览器验证路径。
- UTF-8: 所有文本保持 UTF-8。
