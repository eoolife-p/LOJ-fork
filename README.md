<div align="center">
  <img src="./public/logo.svg" alt="LOJ Logo" width="120" height="120" />
  <h1>LOJ — LeLe Online Judge</h1>
  <p>
    <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a>
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

## Introduction

**LOJ** (LeLe Online Judge) is a modern online judge platform built with Next.js 16. It supports programming problem solving, contests, training tracks, an AI teaching assistant, and multi-engine code execution evaluation.

## Features

- **Problem System** — Create and manage programming problems with multiple test cases, self-test samples, and BlockNote rich text editing
- **Contest System** — ACM / OI scoring modes, real-time rankings, independent problem copies
- **Training Tracks** — Themed problem sets for progressive learning paths
- **AI Assistant** — Integrated AI chat with problem-context-aware programming guidance
- **Multi-Engine Judging** — Pluggable evaluation engines: OneCompiler (default), Judge0, Runoob
- **Code Editor** — Monaco Editor (VS Code engine) with multi-language syntax highlighting
- **User System** — NextAuth authentication, JWT sessions, role-based access control
- **Admin Panel** — Full management for users, problems, contests, training, settings, storage
- **Storage Backends** — Local filesystem / S3-compatible object storage
- **Security Hardening** — Built-in rate limiting, permission validation, IP spoofing protection, SSRF protection

## Getting Started

```bash
git clone https://github.com/aiwandiannaodelele/LOJ.git
cd LOJ
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Build for production |
| `npm run lint` | ESLint code check |
| `npm run db:push` | Push database schema |
| `npm run db:seed` | Seed sample data |
| `npm run db:generate` | Generate Prisma client |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework (App Router) |
| **Tailwind CSS v4** | Styling |
| **shadcn/ui** | UI component library |
| **Prisma 7** | ORM / Database |
| **SQLite / D1** | Database (dev / production) |
| **NextAuth v5** | Authentication (credentials + JWT) |
| **Monaco Editor** | Code editor |
| **BlockNote** | Rich text editor |
| **OneCompiler / Judge0** | Judging engines |

## Deployment

- **Vercel**: zero-config. Connect GitHub repo, set `NEXTAUTH_SECRET` + `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in dashboard.
- **EdgeOne Pages**: zero-config. Connect Git repo, set `NEXTAUTH_SECRET` + `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.  
- **Cloudflare Pages**: requires `@opennextjs/cloudflare` + `wrangler.toml` + D1 database.

## License

MIT
