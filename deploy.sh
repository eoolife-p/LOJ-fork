#!/bin/bash
set -e
R='\033[0m' B='\033[1m' G='\033[32m' C='\033[36m' M='\033[35m' RED='\033[31m'
OK="  ${G}✔${R}" DOT="${C}•${R}"
ok()  { printf "${OK} %s\n" "$1"; }
info(){ printf "${DOT} %s\n" "$1"; }
tit() { printf "\n${B}${M}%s${R}\n" "$1"; }
fail(){ printf "${RED}✘ %s${R}\n" "$1"; exit 1; }

check_port() {
  local port=$1
  if command -v lsof &>/dev/null; then lsof -i :$port -sTCP:LISTEN &>/dev/null
  elif command -v ss &>/dev/null; then ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port"
  elif command -v netstat &>/dev/null; then netstat -tlnp 2>/dev/null | grep -q ":$port"
  else return 1; fi
}

detect_existing() {
  local dir="$1" found=0
  if [ -f "$dir/package.json" ]; then
    grep -q '"name": "loj"' "$dir/package.json" 2>/dev/null && found=1
  fi
  return $((1 - found))
}

uninstall_loj() {
  local dir="$1"
  tit "卸载 LOJ"

  # PM2
  if command -v pm2 &>/dev/null; then
    if pm2 id loj 2>/dev/null | grep -qE '[0-9]+'; then
      pm2 delete loj 2>/dev/null; ok "PM2 进程已停止"
    fi
  fi

  # Docker
  if [ -f "$dir/docker-compose.yml" ]; then
    (cd "$dir" && docker compose down -v 2>/dev/null) && ok "Docker 容器已停止"
  fi

  # Crontab (Docker 自动更新)
  crontab -l 2>/dev/null | grep -v "loj/auto-update" | crontab - 2>/dev/null || true
  # Crontab (PM2 自动更新)
  crontab -l 2>/dev/null | grep -v "loj-pm2-update" | crontab - 2>/dev/null || true
  ok "自动更新已移除"

  rm -rf "$dir" 2>/dev/null && ok "目录已删除: $dir" || warn "目录删除失败: $dir"
  printf "\n${G}${B}  LOJ 已彻底卸载${R}\n"
  exit 0
}

# ── 检测现有部署 ──
DIR="$HOME/loj"
if detect_existing "$DIR"; then
  tit "检测到现有部署: $DIR"
  status=""
  if command -v pm2 &>/dev/null && pm2 id loj 2>/dev/null | grep -qE '[0-9]+'; then
    status="${status}  运行方式: PM2\n"
    port="$(pm2 show loj 2>/dev/null | awk '/port/ {print $NF}' | head -1)"
    status="${status}  端口: ${port:-3000}\n"
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q loj; then
    status="${status}  运行方式: Docker\n"
  fi
  [ -n "$status" ] && printf "$status"
  printf "\n  [U] 卸载  [R] 重新部署  [C] 取消\n"
  printf "  选择: "; read -r ACTION </dev/tty
  case "${ACTION:-c}" in
    u|U) uninstall_loj "$DIR" ;;
    r|R) : ;;
    *) info "已取消"; exit 0 ;;
  esac
fi

# ── 基础配置 ──
printf "\n${B}LOJ 一键部署${R}\n\n"

printf "  使用国内镜像 (gitcode+npmirror)? [Y/n]: "
read -r M </dev/tty; USE_MIRROR=true
[ "${M:-y}" = "n" ] && USE_MIRROR=false
$USE_MIRROR && ok "国内加速" || info "直连 GitHub"

GIT_URL="https://github.com/aiwandiannaodelele/LOJ.git"
$USE_MIRROR && GIT_URL="https://gitcode.com/aiwandiannaodelele/LOJ.git"

printf "  安装目录 [$DIR]: "; read -r D </dev/tty; DIR="${D:-$DIR}"
ok "$DIR"

printf "\n  部署方式: [1] Docker  [2] PM2\n"
printf "  选择 [1]: "; read -r MODE </dev/tty; MODE="${MODE:-1}"

# ── 端口检测 ──
APP_PORT=3000
if check_port "$APP_PORT"; then
  printf "\n  ${RED}!${R} 端口 $APP_PORT 已被占用\n"
  printf "  换一个端口 (回车=$((APP_PORT + 1))): "
  read -r NEW_PORT </dev/tty
  APP_PORT="${NEW_PORT:-$((APP_PORT + 1))}"
  ok "使用端口 $APP_PORT"
fi

# ── 克隆 ──
tit "克隆仓库"
if [ -d "$DIR/.git" ]; then
  info "仓库已存在，拉取最新..."
  (cd "$DIR" && git pull) && ok "已更新"
else
  git clone "$GIT_URL" "$DIR" && ok "克隆完成"
fi
cd "$DIR"

# ═══ Docker ═══
if [ "$MODE" = "1" ]; then
  command -v docker &>/dev/null || fail "请先安装 Docker"
  docker compose version &>/dev/null || fail "需要 Docker Compose"
  ok "Docker 已就绪"

  # 修改端口
  if [ "$APP_PORT" != "3000" ]; then
    sed -i '' "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" docker-compose.yml 2>/dev/null || \
    sed -i "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" docker-compose.yml 2>/dev/null
  fi

  [ ! -f .env ] && cp .env.docker.example .env && ok ".env 已创建"

  tit "构建 & 启动"
  docker compose --profile pgsql up -d --build && \
    ok "部署完成 → http://localhost:$APP_PORT/init" || \
    fail "Docker 启动失败，查看日志: docker compose logs"

  printf "  启用自动更新 (cron 每5分钟)? [Y/n]: "; read -r A </dev/tty
  if [ "${A:-y}" != "n" ]; then
    (crontab -l 2>/dev/null | grep -v loj/auto-update; echo "*/5 * * * * cd $DIR && ./auto-update.sh") | crontab -
    ok "自动更新已启用"
  fi

# ═══ PM2 ═══
elif [ "$MODE" = "2" ]; then
  command -v node &>/dev/null || fail "请先安装 Node.js"
  command -v npm &>/dev/null || fail "请先安装 npm"
  ok "Node $(node -v)"

  command -v pm2 &>/dev/null || { npm install -g pm2; ok "PM2 已安装"; }

  if $USE_MIRROR; then npm config set registry https://registry.npmmirror.com; fi

  tit "安装 & 构建"
  npm install && npm run db:push && npm run build
  ok "构建完成"

  $USE_MIRROR && npm config delete registry 2>/dev/null

  # PM2 端口配置
  if [ "$APP_PORT" != "3000" ]; then
    export PORT=$APP_PORT
    ok "使用端口 $APP_PORT"
  fi

  tit "启动"
  npm run pm2:start
  ok "PM2 已启动 → http://localhost:$APP_PORT/init"

  # PM2 自动更新脚本 — 写入到项目目录内
  mkdir -p "$DIR/scripts"
  cat > "$DIR/scripts/pm2-update.sh" << 'PMEOF'
#!/bin/bash
cd "DIR_PLACEHOLDER"
git fetch origin main 2>/dev/null
LOCAL=$(git rev-parse main 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
if [ "$LOCAL" != "$REMOTE" ] && [ -n "$REMOTE" ]; then
  git pull origin main
  npm install && npm run build
  pm2 restart loj
fi
PMEOF
  sed -i '' "s|DIR_PLACEHOLDER|$DIR|" "$DIR/scripts/pm2-update.sh" 2>/dev/null || \
  sed -i "s|DIR_PLACEHOLDER|$DIR|" "$DIR/scripts/pm2-update.sh" 2>/dev/null
  chmod +x "$DIR/scripts/pm2-update.sh"

  printf "  启用自动更新? [Y/n]: "; read -r A </dev/tty
  if [ "${A:-y}" != "n" ]; then
    (crontab -l 2>/dev/null | grep -v loj-pm2-update; echo "*/5 * * * * $DIR/scripts/pm2-update.sh") | crontab -
    ok "自动更新已启用"
  fi
fi

printf "\n${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
printf "${G}${B}  LOJ 部署完成！${R}"
printf "${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
printf "\n"
