import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import JSZip from "jszip";
import yaml from "js-yaml";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "请选择文件" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    
    const results: { title: string; status: string }[] = [];
    const problems: string[] = [];

    // 找出所有包含 problem.yaml 的目录
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      const parts = path.split("/");
      if (parts.length >= 2 && parts[parts.length - 1] === "problem.yaml") {
        problems.push(parts.slice(0, -1).join("/"));
      }
      // Hydro 也可能用 problem.json
      if (parts.length >= 2 && parts[parts.length - 1] === "problem.json") {
        const dir = parts.slice(0, -1).join("/");
        if (!problems.includes(dir)) problems.push(dir);
      }
    }

    if (problems.length === 0) {
      // 可能直接是单个问题的 ZIP（根目录就有 problem.yaml）
      if (zip.files["problem.yaml"] || zip.files["problem.json"]) {
        problems.push("");
      } else {
        return NextResponse.json({ error: "未找到 Hydro 格式的题目文件（需包含 problem.yaml）" }, { status: 400 });
      }
    }

    for (const problemDir of problems) {
      try {
        const prefix = problemDir ? problemDir + "/" : "";
        
        // 读取 problem.yaml 或 problem.json
        let meta: any;
        const yamlFile = zip.files[prefix + "problem.yaml"];
        const jsonFile = zip.files[prefix + "problem.json"];
        
        if (yamlFile) {
          const content = await yamlFile.async("text");
          meta = yaml.load(content);
        } else if (jsonFile) {
          const content = await jsonFile.async("text");
          meta = JSON.parse(content);
        } else continue;

        const title = meta.title || meta.name || problemDir.split("/").pop() || "Imported Problem";
        const slug = meta.id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        
        // 解析测试数据
        const testCases: { input: string; output: string }[] = [];
        const testdataPrefix = prefix + "testdata/";
        const inFiles = Object.keys(zip.files).filter(f => f.startsWith(testdataPrefix) && f.endsWith(".in"));
        
        for (const inFile of inFiles.sort()) {
          const baseName = inFile.replace(testdataPrefix, "").replace(".in", "");
          const outFile = testdataPrefix + baseName + ".out";
          const ansFile = testdataPrefix + baseName + ".ans";
          const outPath = zip.files[outFile] ? outFile : zip.files[ansFile] ? ansFile : null;
          if (outPath) {
            testCases.push({
              input: (await zip.files[inFile].async("text")).trim(),
              output: (await zip.files[outPath].async("text")).trim(),
            });
          }
        }

        if (testCases.length === 0) {
          // 尝试从 problem.yaml 的 cases 字段获取
          if (meta.cases) {
            for (const c of meta.cases) {
              testCases.push({ input: c.input || "", output: c.output || "" });
            }
          }
        }

        // 创建题目
        await prisma.problem.create({
          data: {
            title,
            slug,
            difficulty: meta.difficulty || "Easy",
            description: meta.description || meta.content || "",
            inputDesc: meta.inputDesc || meta.input || "",
            outputDesc: meta.outputDesc || meta.output || "",
            sampleInput: meta.sampleInput || meta.samples?.[0]?.input || "",
            sampleOutput: meta.sampleOutput || meta.samples?.[0]?.output || "",
            testCases: JSON.stringify(testCases),
            timeLimit: meta.timeLimit || meta.time || meta.limits?.time || 5,
            memoryLimit: meta.memoryLimit || meta.memory || meta.limits?.memory || 256,
            tags: JSON.stringify(meta.tags || []),
          },
        });
        results.push({ title, status: "ok" });
      } catch (e) {
        results.push({ title: problemDir || "root", status: e instanceof Error ? e.message : "error" });
      }
    }

    return NextResponse.json({ results, total: results.length, ok: results.filter(r => r.status === "ok").length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "导入失败" }, { status: 500 });
  }
}
