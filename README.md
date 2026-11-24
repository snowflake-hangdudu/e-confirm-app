# e确镜

医院手术部位确认：移动端 App + 管理后台 + API。

## 对外访问（Demo）

| 项 | 地址 |
|---|---|
| **Android App 下载（固定）** | http://124.222.62.190/download/equejing-android.apk |
| 带版本号备份 | http://124.222.62.190/download/equejing-android-v1.0.0.apk |
| **管理后台** | http://124.222.62.190 |
| API 健康检查 | http://124.222.62.190/api/health |

试用账号（App / 管理端 / API 一致）：`admin` / `123456`

> App 安装包以服务器 `/download/` 为准；该链接长期有效，发新版后会覆盖同名文件。  
> Expo 云构建临时链接会过期，仅作开发备份，例如：  
> https://expo.dev/artifacts/eas/7EFYxrC8y5quNHPouqqvfwgNn5GJKfel_g8iEsIiNlo.apk

## 技术

- **App**：Expo SDK 57 + React Native
- **管理端**：Vue 3 + Vite + Element Plus（仓库 `e-confirm-admin`）
- **API**：Express + PostgreSQL + JWT（仓库 `e-confirm-api`）
- 人体图精细高亮：见 [docs/body-map-highlight.md](./docs/body-map-highlight.md)

## 本地开发

```bash
cd e-confirm-app
npm install
npm run web          # 浏览器竖屏调试
npm start            # Expo Go 真机
```

API 地址默认 `http://124.222.62.190/api`（见 `.env.example`）。

## 打包与发布

| 方式 | 说明 |
|---|---|
| **对外分发** | 本地打 Release APK → `python scripts/upload-apk.py` → 更新 `/download/equejing-android.apk` |
| EAS 云端 | `npm run build:apk`（preview APK，临时下载链） |
| Windows 本地打包 | 见 [scripts/local-android-build.md](./scripts/local-android-build.md)（须复制到 `C:\e-confirm-build`） |

## 演示流程（App）

1. 登录 → 选择患者/家属，填写信息  
2. 人体图点选手术部位 → 确认  
3. 护士填写计划手术并比对 → 生成确认记录（可同步至管理端）

## 仓库

- App：本仓库  
- 管理端：`e-confirm-admin`  
- API：`e-confirm-api`  

服务器运维备忘：[docs/server.md](./docs/server.md)（含 SSH，敏感信息见 `docs/server.secrets.local.md`，勿提交）。
