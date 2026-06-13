#!/bin/bash
set -e
echo "🚀 LOJ Docker 部署"

# 复制环境变量
if [ ! -f .env ]; then
  cp .env.docker.example .env
  echo "⚠️  请编辑 .env 填入你的配置"
  exit 1
fi

# 选数据库模式
DB_PROVIDER=$(grep DB_PROVIDER .env | cut -d= -f2)
if [ "$DB_PROVIDER" = "postgresql" ]; then
  echo "📦 启动 PostgreSQL 模式..."
  docker compose --profile pgsql up -d --build
else
  echo "📦 启动 SQLite 模式..."
  docker compose up -d --build
fi

echo "✅ 完成！访问 http://localhost:3000"
echo "   首次访问 http://localhost:3000/init 初始化管理员"
