# Quickstart: 模板初始化与品牌配置整理

## 1. 启动本地数据依赖

```powershell
docker compose -f deploy/docker-compose.local.yml up -d mysql redis
```

首次创建 `mysql-data` volume 时，MySQL 会执行：

```text
server/admin-service/internal/data/migrations/001_init_rbac.sql
server/admin-service/internal/data/seeds/001_seed_rbac.sql
```

## 2. 启动后端

```powershell
cd server/admin-service
go build -o ./bin/ ./cmd/admin-service
.\bin\admin-service.exe -conf .\configs
```

后端启动时也会执行 embedded SQL，确保已有本地库可被幂等更新。

## 3. 启动前端

```powershell
cd web
npm install
npm run start:no-mock
```

打开：

```text
http://localhost:8000/user/login
```

## 4. 验证登录

登录页只应展示：

- `用户名`
- `密码`

不应展示具体默认账号密码。

本地初始账号：

| 用户名 | 密码 |
| --- | --- |
| `admin` | `ant.design` |
| `user` | `ant.design` |

使用 `admin / ant.design` 登录后，应能进入系统并看到授权菜单。

## 5. 修改模板名称

修改：

```text
web/config/appConfig.ts
```

重新启动或构建前端后，标题、登录页、页脚和示例页应显示新名称。
