# Tasks: 用户管理头像交互优化

## Setup

- [x] T001 新建 013 SDD feature 文档目录。
- [x] T002 更新 `specs/README.zh-CN.md` 加入 013 状态入口。

## Frontend

- [x] T003 移除用户管理创建弹窗中的“头像 URL”输入项。
- [x] T004 移除用户管理编辑弹窗中的“头像 URL”输入项。
- [x] T005 编辑用户提交时合并原 `editingUser.avatar`，避免清空已有头像。
- [x] T006 保留用户列表头像预览和首字兜底展示。

## Tests

- [x] T007 增加用户管理页面测试，确认不渲染“头像 URL”字段。
- [x] T008 增加系统用户服务测试，确认更新请求保留 avatar 字段。

## Validation

- [x] T009 运行 `cd web && npm run lint`。
- [x] T010 运行 `cd web && npm run test`。
- [x] T011 运行 `cd web && npm run build`。
- [x] T012 浏览器验证创建/编辑用户弹窗不出现“头像 URL”。
