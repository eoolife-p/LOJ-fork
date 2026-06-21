import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const names = [
      { key: "next", pkg: "next" },
      { key: "react", pkg: "react" },
      { key: "typescript", pkg: "typescript" },
      { key: "prisma", pkg: "@prisma/client" },
      { key: "tailwindcss", pkg: "tailwindcss" },
      { key: "next-auth", pkg: "next-auth" },
      { key: "lucide-react", pkg: "lucide-react" },
      { key: "@monaco-editor/react", pkg: "@monaco-editor/react" },
      { key: "@blocknote/react", pkg: "@blocknote/react" },
      { key: "recharts", pkg: "recharts" },
    ];

    const versions: Record<string, string> = {};
    for (const { key, pkg: name } of names) {
      const v = deps[name]?.replace(/^[\^~]/, "") || "?";
      versions[key] = v;
    }

    return NextResponse.json(versions);
  } catch {
    return NextResponse.json({});
  }
}
