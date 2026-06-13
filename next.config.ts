import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署需要 standalone 输出
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
