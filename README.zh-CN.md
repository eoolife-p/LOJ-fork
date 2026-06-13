<div align="center">
  <img src="./public/logo.svg" alt="LOJ Logo" width="120" height="120" />
  <h1>LOJ — LeLe Online Judge</h1>
  <p>
    <a href="README.md">English</a> · <a href="README.zh-TW.md">繁體中文</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748" alt="Prisma 7" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind v4" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  </p>
</div>

---

## 简介

**LOJ** (LeLe Online Judge) 是一个现代化的在线评测平台，使用 Next.js 16 构建。支持编程题目练习、比赛、训练题单、AI 智能助教以及多引擎代码执行评测。

## 特性

- **题目系统** — 创建和管理编程题目，支持多测试用例、自测样例、BlockNote 富文本编辑
- **比赛系统** — 支持 ACM / OI 赛制，实时排名，独立题目副本
- **训练题单** — 按主题组织题目，循序渐进的学习路径
- **AI 智能助教** — 集成 AI 对话，题目上下文感知的编程辅导
- **多引擎判题** — 可插拔评测引擎：OneCompiler（默认）、Judge0、Runoob
- **代码编辑器** — Monaco Editor（VS Code 内核）支持多语言语法高亮
- **用户系统** — NextAuth 认证，JWT Session，角色权限管理
- **管理后台** — 用户、题目、比赛、训练、设置、存储全管理
- **多存储支持** — 本地文件系统 / S3 兼容对象存储
- **安全加固** — 内置速率限制、权限校验、IP 伪造防护、SSRF 防护

## 快速开始

```bash
git clone https://github.com/aiwandiannaodelele/LOJ.git
cd LOJ
npm install
npm run db:push
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 命令参考

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (localhost:3000) |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器（默认 SQLite） |
| `npm run lint` | ESLint 代码检查 |
| `npm run db:push` | 同步数据库 Schema |
| `npm run db:seed` | 填充示例数据 |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run pm2:start` | PM2 进程管理启动 |
| `npm run pm2:logs` | 查看 PM2 日志 |

## 技术栈

| 技术 | 用途 |
|------|------|
| **Next.js 16** | React 框架（App Router） |
| **Tailwind CSS v4** | 样式 |
| **shadcn/ui** | UI 组件库 |
| **Prisma 7** | ORM / 数据库 |
| **SQLite / D1** | 数据库（开发 / 生产） |
| **NextAuth v5** | 认证（凭证 + JWT） |
| **Monaco Editor** | 代码编辑器 |
| **BlockNote** | 富文本编辑器 |
| **OneCompiler / Judge0** | 评测引擎 |

## 部署

### 私有部署

**Docker（默认 PostgreSQL）**
```bash
cp .env.docker.example .env
./deploy.sh
```
访问 `http://localhost:3000/init` 设置管理员。

**PM2（默认 SQLite）**
```bash
npm install && npm run build && npm run db:push
npm run pm2:start
```

**Node.js（默认 SQLite）**
```bash
npm install && npm run build && npm run db:push
npm start
```

### 云平台

| 平台 | 数据库 | 说明 |
|------|--------|------|
| **Vercel** | Turso / Supabase | `git push`，设置 `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| **Netlify** | Turso / Supabase | `git push`，原生 Next.js 支持 + 环境变量 |
| **Cloudflare Pages** | D1 | 需要 `@opennextjs/cloudflare` + `wrangler.toml` |

### 数据库选择

| 方案 | Provider | 配置 |
|------|----------|------|
| SQLite | `sqlite` | 本地文件，零配置 |
| PostgreSQL | `postgresql` | 设 `DB_PROVIDER=postgresql` + `DATABASE_URL` |
| Turso | `sqlite` | 设 `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| Cloudflare D1 | `sqlite` | 需要 Cloudflare Pages + D1 绑定 |

## 许可证

MIT
