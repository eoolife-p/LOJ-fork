#!/bin/bash
set -e
R='\033[0m' B='\033[1m' G='\033[32m' C='\033[36m' M='\033[35m' RED='\033[31m'
OK="  ${G}✔${R}" DOT="${C}•${R}"
ok()  { printf "${OK} %s\n" "$1"; }
info(){ printf "${DOT} %s\n" "$1"; }
tit() { printf "\n${B}${M}%s${R}\n" "$1"; }
fail(){ printf "${RED}✘ %s${R}\n" "$1"; exit 1; }

cd /tmp 2>/dev/null || true
pwd > /dev/null 2>&1 || true

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

printf "  使用国内镜像 (gitee+npmirror)? [Y/n]: "
read -r M </dev/tty; USE_MIRROR=true
[ "${M:-y}" = "n" ] && USE_MIRROR=false
$USE_MIRROR && ok "国内加速" || info "直连 GitHub"

GIT_URL="https://github.com/aiwandiannaodelele/LOJ.git"
$USE_MIRROR && GIT_URL="https://gitee.com/aiwandiannaoleleawafangnaodai/LOJ"

printf "  安装目录 [$DIR]: "; read -r D </dev/tty; DIR="${D:-$DIR}"
ok "$DIR"

printf "\n  部署方式: [1] Docker  [2] PM2\n"
printf "  选择 [1]: "; read -r MODE </dev/tty; MODE="${MODE:-1}"

# ── 构建方式（仅 Docker）──
BUILD_MODE="build"
if [ "$MODE" = "1" ]; then
  printf "\n  构建方式: [1] 预构建镜像 (ghcr.nju.edu.cn)  [2] 源码构建\n"
  printf "  选择 [1]: "; read -r BUILD_CHOICE </dev/tty; BUILD_CHOICE="${BUILD_CHOICE:-1}"
  if [ "$BUILD_CHOICE" = "2" ]; then
    BUILD_MODE="build"; ok "源码构建"
  else
    BUILD_MODE="pull"; ok "预构建镜像"
  fi
fi

# ── 端口检测 ──
APP_PORT=3000
while check_port "$APP_PORT"; do
  printf "\n  ${RED}!${R} 端口 $APP_PORT 已被占用\n"
  printf "  换一个端口 (回车=$((APP_PORT + 1))): "
  read -r NEW_PORT </dev/tty
  APP_PORT="${NEW_PORT:-$((APP_PORT + 1))}"
done
ok "端口 $APP_PORT"

# ── 克隆 / 下载 compose 文件 ──
mkdir -p "$DIR"

if [ "$MODE" = "1" ] && [ "$BUILD_MODE" = "pull" ]; then
  # 预构建：只下载 compose 文件，不克隆仓库
  RAW_BASE="https://raw.githubusercontent.com/aiwandiannaodelele/LOJ/main"
  $USE_MIRROR && RAW_BASE="https://gitee.com/aiwandiannaoleleawafangnaodai/LOJ/raw/main"
  tit "下载 compose 文件"
  for f in docker-compose.yml docker-compose.pull.yml; do
    curl -fsSL "$RAW_BASE/$f" -o "$DIR/$f" && ok "$f" || fail "下载 $f 失败"
  done
  # 使用 ghcr 镜像加速
  sed -i '' "s|ghcr.io/|ghcr.nju.edu.cn/|" "$DIR/docker-compose.pull.yml" 2>/dev/null || \
  sed -i "s|ghcr.io/|ghcr.nju.edu.cn/|" "$DIR/docker-compose.pull.yml" 2>/dev/null
elif [ "$MODE" = "2" ] || [ "$BUILD_MODE" = "build" ]; then
  # 源码构建 / PM2：克隆完整仓库
  tit "克隆仓库"
  if [ -d "$DIR/.git" ]; then
    info "仓库已存在，同步最新..."
    if (cd "$DIR" && git fetch origin main && git reset --hard origin/main); then
      ok "已更新"
    else
      info "GitHub 超时，尝试镜像..."
      MIRROR_URL="$GIT_URL"
      (cd "$DIR" && git remote add mirror "$MIRROR_URL" 2>/dev/null || git remote set-url mirror "$MIRROR_URL" && git fetch mirror main && git reset --hard mirror/main) && ok "已更新（镜像）" || info "同步失败，使用现有代码"
    fi
  else
    git clone "$GIT_URL" "$DIR" && ok "克隆完成"
  fi
fi

cd "$DIR" || fail "无法进入目录 $DIR"

# ═══ Docker ═══
if [ "$MODE" = "1" ]; then
  command -v docker &>/dev/null || fail "请先安装 Docker"
  docker compose version &>/dev/null || fail "需要 Docker Compose"
  ok "Docker 已就绪"

  COMPOSE_F="-f docker-compose.yml -f docker-compose.$BUILD_MODE.yml"

  # 修改端口
  if [ "$APP_PORT" != "3000" ]; then
    for f in docker-compose.yml docker-compose.$BUILD_MODE.yml; do
      [ -f "$f" ] && sed -i '' "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" "$f" 2>/dev/null || \
        sed -i "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" "$f" 2>/dev/null || true
    done
  fi

  [ ! -f .env ] && {
    cat > "$DIR/.env" << 'EOF'
DB_PROVIDER=postgresql
DATABASE_URL=postgres://loj:lojpass@postgres:5432/loj
DB_PASSWORD=lojpass
EOF
    ok ".env 已创建"
  }

  tit "构建 & 启动"
  PGSQL="--profile pgsql"
  grep -q 'DB_PROVIDER=sqlite' .env 2>/dev/null && PGSQL=""
  if [ "$BUILD_MODE" = "pull" ]; then
    docker compose $COMPOSE_F $PGSQL pull || fail "拉取预构建镜像失败"
    docker compose $COMPOSE_F $PGSQL up -d || \
      fail "Docker 启动失败，查看日志: docker compose logs"
  else
    docker compose $COMPOSE_F $PGSQL build || fail "构建失败"
    docker compose $COMPOSE_F $PGSQL up -d || \
      fail "Docker 启动失败，查看日志: docker compose logs"
    git checkout -- docker-compose.yml docker-compose.pull.yml docker-compose.build.yml 2>/dev/null || true
  fi

  echo "$BUILD_MODE" > "$DIR/.build-mode"
  ok "部署完成 → http://localhost:$APP_PORT/init"

  # 仅源码构建询问自动更新
  if [ "$BUILD_MODE" = "build" ]; then
    printf "  启用自动更新 (cron 每5分钟)? [Y/n]: "; read -r A </dev/tty
    if [ "${A:-y}" != "n" ]; then
      (crontab -l 2>/dev/null | grep -v loj/auto-update; echo "*/5 * * * * cd $DIR && ./auto-update.sh") | crontab -
      ok "自动更新已启用"
    fi
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

  # PM2 端口 — 写入 ecosystem.config.js
  if [ "$APP_PORT" != "3000" ]; then
    sed -i '' "s/PORT: process.env.PORT || 3000/PORT: $APP_PORT/" ecosystem.config.js 2>/dev/null || \
    sed -i "s/PORT: process.env.PORT || 3000/PORT: $APP_PORT/" ecosystem.config.js 2>/dev/null
    ok "端口 $APP_PORT"
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
