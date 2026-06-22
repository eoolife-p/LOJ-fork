import type { NextConfig } from "next";
import path from "path";

const emptyModule = path.resolve("./scripts/prisma-empty.js");
const wasmAliases: Record<string, string> = {};
const engines = ["cockroachdb", "mysql", "postgresql", "sqlserver"];
const compilers = ["query_compiler_fast_bg", "query_compiler_small_bg"];

for (const compiler of compilers) {
  for (const engine of engines) {
    wasmAliases[`@prisma/client/runtime/${compiler}.${engine}.wasm-base64.js`] = emptyModule;
    wasmAliases[`@prisma/client/runtime/${compiler}.${engine}.js`] = emptyModule;
  }
}

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  transpilePackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@prisma/adapter-pg",
    "@prisma/adapter-d1",
    "@prisma/adapter-better-sqlite3",
  ],
  turbopack: {
    resolveAlias: wasmAliases,
  } as any,
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
  },
};

export default nextConfig;
