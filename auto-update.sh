#!/bin/bash
set -e
cd "$(dirname "$0")"

LOG="/tmp/loj-autoupdate.log"
BUILD_MODE=$(cat .build-mode 2>/dev/null || echo "pull")
COMPOSE_F="-f docker-compose.yml -f docker-compose.$BUILD_MODE.yml"

# 预构建模式：只需拉取镜像，无需 git
if [ "$BUILD_MODE" = "pull" ]; then
  echo "[$(date)] Pulling latest image..." >> "$LOG"
  docker compose $COMPOSE_F pull >> "$LOG" 2>&1
  docker compose $COMPOSE_F up -d >> "$LOG" 2>&1
  echo "[$(date)] Done." >> "$LOG"
  exit 0
fi

# 源码构建模式：检查 git 更新
BRANCH="${1:-main}"

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
  docker compose $COMPOSE_F build >> "$LOG" 2>&1
  docker compose $COMPOSE_F up -d >> "$LOG" 2>&1
  echo "[$(date)] Deployed!" >> "$LOG"
else
  echo "[$(date)] Up to date." >> "$LOG"
fi
