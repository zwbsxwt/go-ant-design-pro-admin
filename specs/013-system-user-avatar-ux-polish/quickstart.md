# Quickstart: 用户管理头像交互优化

## Prerequisites

- MySQL、Redis、Kratos、Ant Design Pro 已按项目 README 启动。
- 使用 `admin / ant.design` 登录。
- 如需验证头像图片展示，RustFS/S3 头像配置按 `specs/009-avatar-upload-rustfs/quickstart.md` 准备。

## Frontend Checks

```powershell
cd web
npm run lint
npm run test
npm run build
```

## Manual Validation

1. 打开 `http://localhost:18080/system/user`。
2. 点击“创建用户”，确认弹窗中没有“头像 URL”输入项。
3. 点击已有用户的“编辑”，确认弹窗中没有“头像 URL”输入项。
4. 修改显示名称、邮箱、手机号或状态并保存。
5. 刷新用户管理列表，确认原头像仍正常展示。
6. 进入个人中心上传头像后返回用户管理，确认头像列能展示新头像。

## Expected Outcomes

- 管理员不再看到或维护裸头像 URL。
- 用户管理列表仍显示头像预览。
- 编辑用户资料不会清空已有头像。
- 头像上传入口仍在个人中心。
