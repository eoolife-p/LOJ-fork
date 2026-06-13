# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG DB_PROVIDER=sqlite
ARG DATABASE_URL=file:./dev.db
ENV DB_PROVIDER=${DB_PROVIDER}
ENV DATABASE_URL=${DATABASE_URL}
ENV DOCKER_BUILD=1
RUN node scripts/switch-provider.js && npx prisma generate && npm run build

# ── Production stage ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
