import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
};

export default nextConfig;
