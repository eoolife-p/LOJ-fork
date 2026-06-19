#!/bin/bash
set -u

# ── 颜色 ──
R='\033[0m'  B='\033[1m'  D='\033[2m'
G='\033[32m' Y='\033[33m' C='\033[36m' M='\033[35m' RED='\033[31m'
OK="  ${G}✔${R}"  WARN="  ${Y}⚠${R}"  ERR="  ${RED}✘${R}"  DOT="${C}•${R}"

# ── 配置 ──
APP_PORT="${LOJ_PORT:-3000}"
ENV_FILE=".env"
EXAMPLE_FILE=".env.docker.example"
DB_PROVIDER="postgresql"
DB_URL=""
PG_PASS=""

panic() { echo -e "\n${RED}${B}致命错误:${R} $1"; exit 1; }
info()  { echo -e "${DOT} $1"; }
ok()    { echo -e "${OK} $1"; }
warn()  { echo -e "${WARN} $1"; }
fail()  { echo -e "${ERR} $1"; }
title() { echo -e "\n${B}${M}$1${R}"; }
step()  { echo -e "${C}${B}▶ $1${R}"; }

# ── Docker 检测 ──
step "环境检测"
if ! command -v docker &>/dev/null; then
  fail "Docker 未安装。请先安装 Docker: https://docs.docker.com/get-docker/"
  exit 1
fi
ok "Docker $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')"

if ! command -v docker &>/dev/null || ! docker compose version &>/dev/null 2>&1; then
  warn "Docker Compose 未独立安装，尝试 docker compose 插件..."
  docker compose version &>/dev/null || panic "需要 Docker Compose。请升级 Docker 版本"
fi
ok "Docker Compose 可用"

# ── 端口检测 ──
step "端口检测 ($APP_PORT)"
check_port() {
  local port=$1
  if command -v ss &>/dev/null; then
    ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port"
  elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":$port"
  elif command -v lsof &>/dev/null; then
    lsof -i :$port -sTCP:LISTEN &>/dev/null
  else return 1; fi
}

if check_port "$APP_PORT"; then
  warn "端口 $APP_PORT 已被占用"
  echo -ne "  换一个端口 (回车=$((APP_PORT + 1))): "
  read -r NEW_PORT
  APP_PORT="${NEW_PORT:-$((APP_PORT + 1))}"
  ok "使用端口 $APP_PORT"
else
  ok "端口 $APP_PORT 可用"
fi

# ── 环境变量 ──
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  title "首次部署 — 创建环境配置"
  echo -e "  ${D}留空直接回车使用默认值${R}"
  echo -e "  ${B}数据库: PostgreSQL${R}"

  DB_PROVIDER="postgresql"
  echo -ne "  数据库密码 (默认=lojpass): "
  read -r PG_PASS
  PG_PASS="${PG_PASS:-lojpass}"
  DB_URL="postgres://loj:${PG_PASS}@postgres:5432/loj"

  echo ""
  echo -ne "  站点端口 (默认=$APP_PORT): "
  read -r INPUT_PORT
  APP_PORT="${INPUT_PORT:-$APP_PORT}"

  # 写入 .env
  {
    echo "# LOJ Docker 配置"
    echo "DB_PROVIDER=$DB_PROVIDER"
    echo "DATABASE_URL=$DB_URL"
    echo "DB_PASSWORD=$PG_PASS"
  } > "$ENV_FILE"
  ok "配置已写入 $ENV_FILE"
else
  ok "已有 $ENV_FILE"
fi

# ── 构建方式 ──
echo ""
echo -e "  ${B}构建方式${R}"
echo -ne "  [1] 预构建镜像 (ghcr.io)  [2] 源码构建: "
read -r BUILD_CHOICE
if [ "${BUILD_CHOICE:-1}" = "2" ]; then
  BUILD_MODE="build"; info "源码构建"
else
  BUILD_MODE="pull"; info "预构建镜像"
fi
COMPOSE_F="-f docker-compose.yml -f docker-compose.$BUILD_MODE.yml"

# ── 构建 & 启动 ──
echo ""
title "LOJ Docker 部署"
  sed -i '' "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" docker-compose.yml 2>/dev/null || sed -i "s/\"3000:3000\"/\"${APP_PORT}:3000\"/" docker-compose.yml 2>/dev/null

  info "启动 PostgreSQL + LOJ..."
  if [ "$BUILD_MODE" = "pull" ]; then
    docker compose $COMPOSE_F pull || info "拉取失败，尝试本地构建..."
    docker compose $COMPOSE_F up -d
  else
    docker compose $COMPOSE_F build
    docker compose $COMPOSE_F up -d
  fi

  if [ $? -ne 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
  echo -e "${RED}${B}  部署失败${R}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
  echo -e "${D}  常见原因:${R}"
  echo -e "  • 端口冲突 — 换一个端口重试"
  echo -e "  • Docker 守护进程未运行 — 启动 Docker Desktop 或 systemctl start docker"
  echo -e "  • 镜像拉取失败 — 检查网络连接"
  echo -e ""
  echo -e "  ${D}查看完整日志: docker compose logs${R}"
  exit 1
fi

# ── 完成 ──
sleep 2
echo "$BUILD_MODE" > .build-mode
echo ""
echo -e "${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
echo -e "${G}${B}  LOJ 部署成功！${R}"
echo -e "${G}${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
echo -e ""
echo -e "  ${B}访问地址${R}  ${C}http://localhost:${APP_PORT}${R}"
echo -e "  ${B}初始化  ${R}  ${C}http://localhost:${APP_PORT}/init${R}"
echo -e ""
echo -e "  ${D}管理命令:${R}"
echo -e "  更新部署   git pull && docker compose up -d --build"
echo ""

# ── 自动更新 ──
echo -ne "  ${B}启用自动更新？${R} (每5分钟检查更新) [Y/n]: "
read -r AUTO
if [ "${AUTO:-y}" != "n" ] && [ "${AUTO:-y}" != "N" ]; then
  echo -ne "  ${B}使用国内镜像？${R} (gitee.com) [Y/n]: "
  read -r MIRROR
  if [ "${MIRROR:-y}" != "n" ] && [ "${MIRROR:-y}" != "N" ]; then
    git remote set-url origin https://gitee.com/aiwandiannaoleleawafangnaodai/LOJ 2>/dev/null
    git remote add github https://github.com/aiwandiannaodelele/LOJ.git 2>/dev/null || git remote set-url github https://github.com/aiwandiannaodelele/LOJ.git 2>/dev/null
    ok "已切换到 gitee.com 镜像"
  fi
  chmod +x auto-update.sh
  (crontab -l 2>/dev/null | grep -v "loj/auto-update"; echo "*/5 * * * * cd $(pwd) && ./auto-update.sh") | crontab -
  ok "自动更新已启用（每5分钟）"
else
  info "跳过自动更新"
fi
echo ""
