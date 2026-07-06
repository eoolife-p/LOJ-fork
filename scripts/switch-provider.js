const fs = require("fs");
const path = require("path");

// 加载 .env 文件
try { require("dotenv").config(); } catch {}

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

const provider = process.env.DB_PROVIDER || "sqlite";
const target = `provider = "${provider}"`;

// 替换 provider
schema = schema.replace(/provider = "(sqlite|postgresql)"/, target);
fs.writeFileSync(schemaPath, schema);
console.log(`[prisma] provider set to: ${provider}`);
