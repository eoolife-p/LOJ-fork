#!/bin/bash
set -e
cd "$(dirname "$0")"

BRANCH="${1:-main}"
LOG="/tmp/loj-autoupdate.log"

BUILD_MODE=$(cat .build-mode 2>/dev/null || echo "pull")
COMPOSE_F="-f docker-compose.yml -f docker-compose.$BUILD_MODE.yml"
PGSQL="--profile pgsql"
grep -q 'DB_PROVIDER=sqlite' .env 2>/dev/null && PGSQL=""

# 优先用 Gitee 镜像，失败则用 GitHub
REMOTE=$(git remote get-url origin 2>/dev/null)
if echo "$REMOTE" | grep -qE "gitee|gitcode"; then
  GIT_URL="$REMOTE"
else
  GIT_URL="https://github.com/aiwandiannaodelele/LOJ.git"
  git ls-remote https://gitee.com/aiwandiannaoleleawafangnaodai/LOJ HEAD &>/dev/null && GIT_URL="https://gitee.com/aiwandiannaoleleawafangnaodai/LOJ"
fi

echo "[$(date)] Checking for updates from $GIT_URL..." >> "$LOG"

git remote add mirror "$GIT_URL" 2>/dev/null || git remote set-url mirror "$GIT_URL" 2>/dev/null || true
git fetch mirror "$BRANCH" 2>/dev/null

LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
REMOTE_HASH=$(git rev-parse "mirror/$BRANCH" 2>/dev/null)

if [ "$LOCAL" != "$REMOTE_HASH" ] && [ -n "$REMOTE_HASH" ]; then
  echo "[$(date)] New commit $REMOTE_HASH, pulling..." | tee -a "$LOG"
  git fetch mirror "$BRANCH" && git reset --hard "mirror/$BRANCH"
  if [ "$BUILD_MODE" = "pull" ]; then
    docker compose $COMPOSE_F $PGSQL pull || echo "  拉取失败，尝试本地构建..." | tee -a "$LOG"
    docker compose $COMPOSE_F $PGSQL up -d
  else
    docker compose $COMPOSE_F $PGSQL build
    docker compose $COMPOSE_F $PGSQL up -d
  fi
  echo "[$(date)] Deployed!" >> "$LOG"
else
  echo "[$(date)] Up to date." >> "$LOG"
fi
