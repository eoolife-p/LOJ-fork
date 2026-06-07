# LOJ — Agent Guide

## Prisma 7 (new config format)
- `prisma.config.ts` replaces `prisma/schema.prisma` for datasource/client config.
- Run `npm run db:generate` after schema changes. Output lands in `src/generated/prisma` (gitignored).
- Local DB: `npm run db:push` to sync, `npm run db:seed` to populate. SQLite at `dev.db`.
- Adapter auto-selects: Turso, Cloudflare D1, or Better-SQLite3 (local dev).

## Framework
- **Next.js 16** (⚠️ has breaking changes from training data) — read `node_modules/next/dist/docs/` before writing code.
- **Tailwind v4** (not v3) — uses `@tailwindcss/postcss` plugin and `@import "tailwindcss"`, no `tailwind.config.ts`.
- **shadcn/ui** (base-nova style) — components in `src/components/ui/`, use `npx shadcn@latest add` to add new ones.
- **React 19** — all components use `"use client"` or RSC appropriately.

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run build` | Standard Next.js build |
| `npm run db:generate` | Prisma client codegen |
| `npm run db:seed` | Seed problems, contests, trainings |

## Architecture
- **Auth**: NextAuth v5 beta, credentials/JWT only. `src/middleware.ts` is lightweight (no Prisma). API routes use `auth()` from `@/lib/auth`.
- **Judge**: Pluggable engines — swap via `src/config/judge.ts` (`engine` field). OneCompiler is default; Judge0 and Runoob are alternatives.
- **Route organization**: All pages under `src/app/`, API routes under `src/app/api/`. Admin APIs under `src/app/api/admin/`.
- **Path alias**: `@/*` → `./src/*`
- **Security**: In-memory rate limiting (resets on restart) — login brute-force, registration, submit cooldown. See CVE annotations in code.
- **Monaco Editor** (`@monaco-editor/react`) for code editing, **BlockNote** for rich text.

## Deployment
- **Vercel**: zero-config, connect GitHub repo, set `NEXTAUTH_SECRET` + Turso env vars in dashboard.
- **EdgeOne Pages**: zero-config, connect Git repo, set `NEXTAUTH_SECRET` + Turso env vars.
- **Cloudflare Pages**: requires `@opennextjs/cloudflare` + `wrangler.toml` (not included, add manually if needed).
- Production requires a strong `NEXTAUTH_SECRET`.

## No tests
No test framework is configured. No `jest`/`vitest`/playwright files exist.
