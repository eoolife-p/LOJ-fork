#!/bin/bash
set -e
cd "$(dirname "$0")"

BRANCH="${1:-main}"
LOG="/tmp/loj-autoupdate.log"

# 优先用 Gitee 镜像，失败则用 GitHub
REMOTE=$(git remote get-url origin 2>/dev/null)
if echo "$REMOTE" | grep -q "gitcode"; then
  GIT_URL="$REMOTE"
else
  GIT_URL="https://github.com/aiwandiannaodelele/LOJ.git"
  git ls-remote https://gitcode.com/aiwandiannaodelele/LOJ.git HEAD &>/dev/null && GIT_URL="https://gitcode.com/aiwandiannaodelele/LOJ.git"
fi

echo "[$(date)] Checking for updates from $GIT_URL..." >> "$LOG"

git remote add mirror "$GIT_URL" 2>/dev/null || git remote set-url mirror "$GIT_URL" 2>/dev/null || true
git fetch mirror "$BRANCH" 2>/dev/null

LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
REMOTE_HASH=$(git rev-parse "mirror/$BRANCH" 2>/dev/null)

if [ "$LOCAL" != "$REMOTE_HASH" ] && [ -n "$REMOTE_HASH" ]; then
  echo "[$(date)] New commit $REMOTE_HASH, pulling..." | tee -a "$LOG"
  git pull mirror "$BRANCH"
  docker compose up -d --build
  echo "[$(date)] Deployed!" >> "$LOG"
else
  echo "[$(date)] Up to date." >> "$LOG"
fi
