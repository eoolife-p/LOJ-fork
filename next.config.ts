import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
};

export default nextConfig;
