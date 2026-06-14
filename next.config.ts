import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署需要 standalone 输出
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
};

export default nextConfig;
