import "dotenv/config";
import { defineConfig } from "prisma/config";

const dbUrl = process.env["DATABASE_URL"];
const isValidDbUrl = dbUrl && (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: isValidDbUrl ? dbUrl : "postgresql://localhost:5432/placeholder",
  },
});
