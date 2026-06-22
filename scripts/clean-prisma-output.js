// Post-build: remove unused Prisma WASM query compiler files from server chunks
// EdgeOne limit: 128MB. We only need SQLite engine for Turso.
const fs = require("fs");
const path = require("path");

const chunksDir = path.join(__dirname, "../.next/server/chunks");
if (!fs.existsSync(chunksDir)) {
  console.log("[postbuild] No .next/server/chunks, skipping");
  process.exit(0);
}

const files = fs.readdirSync(chunksDir);
let removed = 0;
let saved = 0;

for (const file of files) {
  // Remove non-SQLite WASM-based query compiler chunks
  // Keep only sqlite variants
  if (
    file.includes("cockroachdb.wasm-base64") ||
    file.includes("mysql.wasm-base64") ||
    file.includes("postgresql.wasm-base64") ||
    file.includes("sqlserver.wasm-base64") ||
    file.includes("cockroachdb.js") ||
    file.includes("mysql.js") ||
    file.includes("postgresql.js") ||
    file.includes("sqlserver.js")
  ) {
    const filePath = path.join(chunksDir, file);
    const size = fs.statSync(filePath).size;
    if (file.startsWith("_") && file.endsWith(".js")) {
      // Only remove chunk files (not other server files)
      try {
        fs.unlinkSync(filePath);
        removed++;
        saved += size;
        console.log(`[postbuild] Removed: ${file} (${(size / 1024 / 1024).toFixed(1)}MB)`);
      } catch {}
    }
  }
}

console.log(`[postbuild] Cleaned ${removed} files, saved ~${(saved / 1024 / 1024).toFixed(1)}MB`);
