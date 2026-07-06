const fs = require("fs");
const path = require("path");

// 加载 .env 文件
try { require("dotenv").config(); } catch {}

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

// 自动检测 provider：优先 DB_PROVIDER 环境变量，其次根据 DATABASE_URL 前缀推断
let provider = process.env.DB_PROVIDER;
if (!provider) {
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("postgres") || dbUrl.startsWith("postgresql")) {
    provider = "postgresql";
  } else if (dbUrl.startsWith("libsql://") || dbUrl.startsWith("turso://")) {
    provider = "sqlite"; // libsql 兼容 sqlite
  } else {
    provider = "sqlite"; // 默认
  }
}

const target = `provider = "${provider}"`;

// 替换 provider
schema = schema.replace(/provider = "(sqlite|postgresql)"/, target);
fs.writeFileSync(schemaPath, schema);
console.log(`[prisma] provider set to: ${provider}`);
