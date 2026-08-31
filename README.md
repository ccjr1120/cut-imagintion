# cut-imagintion

古梦雪的视频剪辑作品集与内容管理后台，基于 Next.js、React 和 TypeScript。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

前台位于 `http://localhost:3000`，管理后台位于 `http://localhost:3000/admin`。开发环境未配置 `.env.local` 时，后台默认密码为 `admin`；生产环境必须配置 `ADMIN_PASSWORD` 与 `SESSION_SECRET`。

## 内容与媒体

- 初始内容保存在 `data/portfolio.json`。
- 后台上传的图片和视频保存在 `storage/media`。
- 生产环境可用 `PORTFOLIO_DATA_FILE` 和 `PORTFOLIO_MEDIA_DIR` 把内容放到独立持久化目录。
- 后台支持分类与项目的新增、编辑、排序和删除；媒体既可直接上传，也可填写 `http(s)` 外链。

## 检查与构建

```bash
npm run lint
npm run typecheck
npm run build
```

## 部署

服务器需安装 Node.js 22+、Caddy 和 systemd。复制部署配置并填写服务器地址、管理员密码和会话密钥：

```bash
cp .env.deploy.example .env.deploy
npm run deploy
```

部署脚本会上传 Next.js standalone 服务，创建/更新 systemd 服务，并配置 Caddy 反向代理。后台内容和上传文件保存在 `$DEPLOY_PATH/shared`，后续部署不会覆盖。
