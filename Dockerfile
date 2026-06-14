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
# 完整 node_modules，确保 prisma db push 所有依赖可用
COPY --from=builder /app/node_modules ./node_modules

# 启动脚本：等待数据库就绪后自动建表
RUN printf '#!/bin/sh\nfor i in 1 2 3 4 5 6 7 8 9 10; do\n  echo "[startup] prisma db push attempt $i..."\n  node node_modules/prisma/build/index.js db push && break\n  sleep 3\ndone\nexec node server.js\n' > /app/start.sh && chmod +x /app/start.sh

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["/app/start.sh"]
