import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
  turbopack: {
    resolveAlias: {
      "@prisma/client/runtime/client": path.resolve("node_modules/@prisma/client/runtime/client.js"),
    },
  },
};

export default nextConfig;
