# LOJ — Agent Guide

## Build & dev

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | Runs `switch-provider.js` → `prisma generate` → `next build` |
| `npm run lint` | ESLint 9 (flat config, `eslint.config.mjs`) |
| `npm run db:push` | Sync Prisma schema to local SQLite |
| `npm run db:generate` | Prisma client codegen only |
| `npm run db:seed` | Seed DB (`tsx prisma/seed.ts`) |
| `npm run db:studio` | Prisma Studio |

## Prisma 7

- Schema: `prisma/schema.prisma` — **provider is rewritten at build time** by `scripts/switch-provider.js` based on `DB_PROVIDER` env var (`sqlite` or `postgresql`).
- Config: `prisma.config.ts` — just datasource URL + schema path. Prisma 7 format.
- Output: `src/generated/prisma/` (gitignored).
- `src/lib/prisma.ts` auto-selects adapter at runtime: PostgreSQL native → Turso/libSQL → Cloudflare D1 → Better-SQLite3 (local dev).
- `dev.db` (SQLite, gitignored) for local.
- Imports from `@/generated/prisma/client`.

## Framework

- **Next.js 16** — may have breaking changes from training data. Read `node_modules/next/dist/docs/` before writing code.
- **React 19** — `"use client"` / RSC as appropriate.
- **Tailwind v4** — `@import "tailwindcss"`, no `tailwind.config.ts`. PostCSS: `@tailwindcss/postcss`.
- **shadcn/ui** — style `base-nova`, `components.json` at root. Add with `npx shadcn@latest add`.
- **Path alias**: `@/*` → `./src/*`.

## Auth (NextAuth v5 beta)

- Strategy: JWT-only, credentials (email+password, bcrypt) + OAuth (GitHub, Google).
- OAuth client IDs: env vars `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` etc., **or** stored in DB `Settings.oauthProviders` (JSON array, admin-configurable). `src/lib/auth.ts:24-35` reads DB first.
- **NEXTAUTH_SECRET auto-generated**: if not in env, derived via pure JS hash of `TURSO_DATABASE_URL || DATABASE_URL`. Both `src/lib/auth.ts:220-226` and `src/middleware.ts:5-11` implement the same algorithm.
- **Middleware** (`src/middleware.ts`): Edge runtime, no Prisma. Decodes JWT directly from cookie using `@auth/core/jwt`. Protects `/admin` pages, `/api/admin` endpoints, `/api/submit`, `/api/run`, `/profile`.
- `src/types/next-auth.d.ts` extends `Session.user` with `id`, `role`, `userGroupId`, `isAdmin`.
- Admin check: `userGroup.isAdmin` (not `role` field — `role` is legacy compat).

## Security (in-memory — resets on restart)

- Login brute-force: 5 attempts per email, 20 per IP, 15-min lockout (`src/lib/security.ts`).
- Registration rate limit per IP (configurable via Settings).
- Submit/run cooldown via Settings DB.
- SSRF protection for image URLs (`isSafeImageUrl`). Code length 64KB limit, language whitelist.
- CVE annotations in source (`CVE-4`, `CVE-6`, `CVE-7`, `CVE-8`, etc.).

## Database migrations

- **Cold start**: `src/lib/migrate.ts` runs at auth init. Checks if `User` table exists; if not, runs full DDL (hardcoded SQLite CREATE TABLE statements). If exists, runs incremental ALTER TABLE for new columns.
- No Prisma Migrate. Schema changes require updating `MIGRATION_SQL` arrays in `migrate.ts`.
- For PostgreSQL, use `prisma db push` or manual migration.

## Architecture

- **Pages**: `src/app/` — Next.js App Router.
- **API routes**: `src/app/api/`. Admin APIs in `src/app/api/admin/`.
- **Judge**: Pluggable engine via `src/config/judge.ts`. Default: OneCompiler. Swap `engine` field. Alternatives: Judge0, custom.
- **Editor**: Monaco (`@monaco-editor/react`). Command palette (F1/Ctrl+Shift+P) intentionally suppressed — do not re-enable.
- **Rich text**: BlockNote (`@blocknote/react`, `@blocknote/shadcn`).
- **AI**: OpenAI-compatible chat via `@ai-sdk/openai`. API key and base URL configurable in Settings DB.
- **Feature flags**: `src/lib/feature-flags.ts` — training, contest, rank, discussion toggles read from Settings with 30s cache.
- **Storage**: Pluggable (database, S3, image hosting) via Settings DB.
- **Image hosting**: Separate `src/lib/image-hosting.ts` for external image hosting.
- **Rate limiting for submit/run**: Read from Settings DB cooldown values.

## Deployment

- **Docker**: `Dockerfile` (multi-stage, standalone output). `docker compose --profile pgsql up -d --build` for PostgreSQL. No profile for SQLite-only.
- **PM2**: `ecosystem.config.js` (SQLite, 1 instance, 500M max mem). `npm run pm2:start/stop/restart/logs`.
- **`deploy.sh`**: Interactive (curl\|bash), picks Docker or PM2 mode, offers gitcode mirror + npm mirror.
- **`auto-update.sh`**: Cron-based git polling with gitcode fallback.
- **Vercel**: Zero-config (set env vars). Builds via `npm run build`.
- **Netlify**: Native Next.js (`netlify.toml` with `npm run build` + node 22). No plugin needed.
- **Cloudflare Pages**: `edgeone.json` config present. No `@opennextjs/cloudflare` or `wrangler.toml` in repo.
- **Env example**: `.env.example` / `.env.docker.example`.

## No tests

No test framework (`jest`, `vitest`, `playwright`) is installed or configured. No test scripts exist.

## Misc

- `.env*` files gitignored (except `.env.example`).
- `DOCKER_BUILD=1` env var enables Next.js standalone output in `next.config.ts`.
- Repo language: zh-CN primary (UI, comments, commit messages). Some admin features support English.
- `CLAUDE.md` just delegates to `AGENTS.md`. Remove `CLAUDE.md` if you update this file.
