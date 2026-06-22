import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  transpilePackages: [
    "@prisma/adapter-libsql",
    "@prisma/adapter-pg",
    "@prisma/adapter-d1",
    "@prisma/adapter-better-sqlite3",
  ],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
};

export default nextConfig;
