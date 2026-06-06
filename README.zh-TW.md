<div align="center">
  <img src="./public/logo.svg" alt="LOJ Logo" width="120" height="120" />
  <h1>LOJ — LeLe Online Judge</h1>
  <p>
    <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
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

## 簡介

**LOJ** (LeLe Online Judge) 是一個現代化的在線評測平台，使用 Next.js 16 構建。支持編程題目練習、比賽、訓練題單、AI 智能助教以及多引擎代碼執行評測。

## 特性

- **題目系統** — 創建和管理編程題目，支持多測試用例、自測樣例、BlockNote 富文本編輯
- **比賽系統** — 支持 ACM / OI 賽制，實時排名，獨立題目副本
- **訓練題單** — 按主題組織題目，循序漸進的學習路徑
- **AI 智能助教** — 集成 AI 對話，題目上下文感知的編程輔導
- **多引擎判題** — 可插拔評測引擎：OneCompiler（默認）、Judge0、Runoob
- **代碼編輯器** — Monaco Editor（VS Code 內核）支持多語言語法高亮
- **用戶系統** — NextAuth 認證，JWT Session，角色權限管理
- **管理後臺** — 用戶、題目、比賽、訓練、設置、存儲全管理
- **多存儲支持** — 本地文件系統 / S3 兼容對象存儲
- **安全加固** — 內置速率限制、權限校驗、IP 偽造防護、SSRF 防護

## 快速開始

```bash
git clone https://github.com/aiwandiannaodelele/LOJ.git
cd LOJ
npm install
npm run db:push
npm run db:seed
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 即可訪問。

## 命令參考

| 命令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發服務器 |
| `npm run build` | 構建生產版本 |
| `npm run lint` | ESLint 代碼檢查 |
| `npm run db:push` | 同步數據庫 Schema |
| `npm run db:seed` | 填充示例數據 |
| `npm run db:generate` | 生成 Prisma 客戶端 |
| `npm run cf:build` | Cloudflare Pages 構建 |
| `npm run cf:deploy` | Cloudflare 部署 |

## 技術棧

| 技術 | 用途 |
|------|------|
| **Next.js 16** | React 框架（App Router） |
| **Tailwind CSS v4** | 樣式 |
| **shadcn/ui** | UI 組件庫 |
| **Prisma 7** | ORM / 數據庫 |
| **SQLite / D1** | 數據庫（開發 / 生產） |
| **NextAuth v5** | 認證（憑證 + JWT） |
| **Monaco Editor** | 代碼編輯器 |
| **BlockNote** | 富文本編輯器 |
| **OneCompiler / Judge0** | 評測引擎 |

## 部署

詳見 [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/framework-guides/nextjs/) 和 `wrangler.toml`。

---

<div align="center">
  <sub>Built with ❤️ using Next.js 16, Tailwind CSS v4, and Prisma 7</sub>
</div>
