// Pre-build: create symlink so EdgeOne's Turbopack can find hashed Prisma client
const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "../node_modules/@prisma/client-2c3a283f134fdcb6");

if (!fs.existsSync(targetDir)) {
  const sourceDir = path.join(__dirname, "../node_modules/@prisma/client");
  try {
    fs.symlinkSync(sourceDir, targetDir, "dir");
    console.log(`[prebuild] Created symlink: @prisma/client-2c3a283f134fdcb6 -> @prisma/client`);
  } catch (e) {
    // symlink may fail on some systems; fall back to copy
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    console.log(`[prebuild] Copied: @prisma/client-2c3a283f134fdcb6 (symlink failed: ${e.message})`);
  }
} else {
  console.log(`[prebuild] Symlink already exists: @prisma/client-2c3a283f134fdcb6`);
}
