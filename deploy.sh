#!/bin/bash
set -e

# ── 颜色 ──
R='\033[0m' B='\033[1m' D='\033[2m'
G='\033[32m' Y='\033[33m' C='\033[36m' M='\033[35m' RED='\033[31m'
OK="  ${G}✔${R}" DOT="${C}•${R}"
info()  { echo -e "${DOT} $1"; }
ok()    { echo -e "${OK} $1"; }
title() { echo -e "\n${B}${M}$1${R}"; }

# ── 镜像选择 ──
USE_MIRROR=false
echo -e "${B}LOJ 一键部署脚本${R}"
echo ""
echo -ne "  使用国内镜像？(gitcode.com + npmmirror) [Y/n]: "
read -r M
if [ "${M:-y}" != "n" ] && [ "${M:-y}" != "N" ]; then USE_MIRROR=true; ok "启用国内加速"; fi

# ── 仓库地址 ──
if $USE_MIRROR; then
  GIT_URL="https://gitcode.com/aiwandiannaodelele/LOJ.git"
  NPM_REGISTRY="https://registry.npmmirror.com"
else
  GIT_URL="https://github.com/aiwandiannaodelele/LOJ.git"
  NPM_REGISTRY=""
fi

# ── 部署目录 ──
INSTALL_DIR="${LOJ_DIR:-/opt/loj}"
echo -ne "  安装目录 [${INSTALL_DIR}]: "
read -r DIR
INSTALL_DIR="${DIR:-$INSTALL_DIR}"

# ── 部署方式 ──
echo ""
echo -e "  ${B}部署方式${R}"
echo -e "  [1] ${B}Docker${R} (需 docker + compose)"
echo -e "  [2] PM2 (需 Node.js 22)"
echo -ne "  选择 [1]: "
read -r MODE
MODE="${MODE:-1}"

# ── Docker ──
if [ "$MODE" = "1" ]; then
  command -v docker &>/dev/null || { echo -e "${RED}Docker 未安装，请先安装 Docker${R}"; exit 1; }
  docker compose version &>/dev/null || { echo -e "${RED}需要 Docker Compose${R}"; exit 1; }
  ok "Docker 环境就绪"

  title "克隆仓库"
  if [ -d "$INSTALL_DIR" ]; then
    info "目录已存在，跳过克隆"
  else
    git clone "$GIT_URL" "$INSTALL_DIR"
    ok "已克隆到 $INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"

  # ── .env ──
  if [ ! -f .env ]; then
    cp .env.docker.example .env
    echo -ne "  数据库密码 (默认 lojpass): "; read -r PG; PG="${PG:-lojpass}"
    echo -ne "  端口 (默认 3000): "; read -r PORT; PORT="${PORT:-3000}"
    sed -i '' "s/lojpass/${PG}/" .env 2>/dev/null || sed -i "s/lojpass/${PG}/" .env 2>/dev/null
    sed -i '' "s|3000:3000|${PORT}:3000|" docker-compose.yml 2>/dev/null || sed -i "s|3000:3000|${PORT}:3000|" docker-compose.yml 2>/dev/null
    ok ".env 已创建"
  fi

  # ── 构建启动 ──
  title "启动服务"
  docker compose --profile pgsql up -d --build
  ok "Docker 部署完成"
  echo -e "  ${B}访问${R} ${C}http://localhost:${PORT:-3000}/init${R}"

  # ── 自动更新 ──
  echo -ne "  启用自动更新 (cron 每5分钟)? [Y/n]: "; read -r AUTO
  if [ "${AUTO:-y}" != "n" ]; then
    (crontab -l 2>/dev/null | grep -v "loj/auto-update"; echo "*/5 * * * * cd $INSTALL_DIR && ./auto-update.sh") | crontab -
    ok "自动更新已启用"
  fi

# ── PM2 ──
elif [ "$MODE" = "2" ]; then
  command -v node &>/dev/null || { echo -e "${RED}Node.js 未安装${R}"; exit 1; }
  node -v | grep -q "v22\|v20\|v18" || { echo -e "${Y}建议 Node.js 18-22${R}"; }
  command -v npm &>/dev/null || { echo -e "${RED}npm 未安装${R}"; exit 1; }
  ok "Node.js $(node -v)"

  command -v pm2 &>/dev/null || {
    info "安装 PM2..."
    if $USE_MIRROR; then npm config set registry "$NPM_REGISTRY"; fi
    npm install -g pm2
    ok "PM2 已安装"
  }

  title "克隆仓库"
  if [ -d "$INSTALL_DIR" ]; then
    info "目录已存在，跳过克隆"
  else
    git clone "$GIT_URL" "$INSTALL_DIR"
    ok "已克隆到 $INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"

  if $USE_MIRROR; then npm config set registry "$NPM_REGISTRY"; fi

  title "安装依赖 & 构建"
  npm install
  npm run db:push
  npm run build
  ok "构建完成"

  echo -ne "  端口 (默认 3000): "; read -r PORT; PORT="${PORT:-3000}"
  export PORT
  sed -i '' "s/\"3000/\"${PORT}/" ecosystem.config.js 2>/dev/null || sed -i "s/\"3000/\"${PORT}/" ecosystem.config.js 2>/dev/null

  npm run pm2:start

  # 恢复默认 registry
  $USE_MIRROR && npm config delete registry 2>/dev/null

  ok "PM2 部署完成"
  echo -e "  ${B}访问${R} ${C}http://localhost:${PORT}/init${R}"

  # ── 自动更新 ──
  echo -ne "  启用自动更新 (cron 每5分钟)? [Y/n]: "; read -r AUTO
  if [ "${AUTO:-y}" != "n" ]; then
    cat > /tmp/loj-pm2-update.sh << CRONEOF
#!/bin/bash
cd $INSTALL_DIR
git fetch origin main 2>/dev/null
LOCAL=\$(git rev-parse main)
REMOTE=\$(git rev-parse origin/main)
if [ "\$LOCAL" != "\$REMOTE" ] && [ -n "\$REMOTE" ]; then
  git pull origin main
  npm install && npm run build && pm2 restart loj
fi
CRONEOF
    chmod +x /tmp/loj-pm2-update.sh
    (crontab -l 2>/dev/null | grep -v "loj-pm2-update"; echo "*/5 * * * * /tmp/loj-pm2-update.sh") | crontab -
    ok "自动更新已启用"
  fi

  echo -e "  ${B}管理${R} pm2 start loj | pm2 restart loj | npm run pm2:logs"
fi

echo ""
echo -e "${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
echo -e "${G}${B}  LOJ 部署完成！${R}"
echo -e "${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
