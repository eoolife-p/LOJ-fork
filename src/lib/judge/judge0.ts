import type { IJudgeEngine, JudgeResult, JudgeStatus } from "./types";
import type { JudgeConfig } from "@/config/judge";
import { isSafeImageUrl } from "@/lib/security";

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUtf8(str: string | null): string {
  if (!str) return "";
  try {
    const binary = atob(str);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

const JUDGE0_LANG_IDS: Record<string, number> = {
  c: 50, cpp: 54, java: 62, python3: 71, python2: 70,
  go: 60, csharp: 51, php: 68, javascript: 63, ruby: 72, rust: 73,
};

export class Judge0Engine implements IJudgeEngine {
  private cfg: JudgeConfig["judge0"];

  constructor(config?: JudgeConfig) {
    this.cfg = config?.judge0 ?? {
      baseUrl: process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com",
      token: process.env.JUDGE0_TOKEN || "",
      languageId: 54,
      timeLimit: 5,
      memoryLimit: 256,
    };
  }

  async judgeWithSPJ(spjCode: string, spjLanguage: string, input: string, userOutput: string, expectedOutput: string): Promise<{ status: "AC" | "WA"; message: string }> {
    if (!this.cfg.baseUrl) return { status: "WA", message: "Judge0 未配置" };
    try {
      const spjWrapper = `#include <iostream>\n#include <string>\nusing namespace std;\nstring INPUT = R"SPLIT(${input.replace(/\\/g, "\\\\")})SPLIT";\nstring USER_OUTPUT = R"SPLIT(${userOutput.replace(/\\/g, "\\\\")})SPLIT";\nstring EXPECTED = R"SPLIT(${expectedOutput.replace(/\\/g, "\\\\")})SPLIT";\nbool check(const string& in, const string& out, const string& ans);\n${spjCode}\nint main() { bool result = check(INPUT, USER_OUTPUT, EXPECTED); cout << (result ? "AC" : "WA") << endl; return result ? 0 : 1; }`;
      const langId = JUDGE0_LANG_IDS[spjLanguage] || 54;
      const res = await fetch(`${this.cfg.baseUrl}/submissions?base64_encoded=false&wait=true`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: spjWrapper, language_id: langId, stdin: "", cpu_time_limit: 5, memory_limit: 256000 }),
      });
      if (!res.ok) return { status: "WA", message: "SPJ 服务异常" };
      const data = await res.json() as any;
      if (data.status?.id === 3) {
        const stdout = (data.stdout || "").trim();
        return stdout.startsWith("AC") ? { status: "AC", message: "" } : { status: "WA", message: stdout.replace("WA: ", "") || "SPJ 判定错误" };
      }
      return { status: "WA", message: "SPJ 运行异常" };
    } catch { const ok = userOutput.trim() === expectedOutput.trim(); return { status: ok ? "AC" : "WA", message: ok ? "" : "SPJ 执行失败" }; }
  }

  async run(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    _memoryLimit: number
  ): Promise<JudgeResult> {
    return this.execute(code, language, input, timeLimit);
  }

  async submit(
    code: string,
    language: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    _memoryLimit: number
  ): Promise<JudgeResult> {
    const result = await this.execute(code, language, input, timeLimit);

    if (result.status === "AC") {
      const normalizedOutput = result.stdout.trim().replace(/\r\n/g, "\n");
      const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, "\n");
      if (normalizedOutput !== normalizedExpected) {
        return {
          status: "WA",
          stdout: result.stdout,
          stderr: `Expected:\n${normalizedExpected}\n\nGot:\n${normalizedOutput}`,
          time: result.time,
          memory: result.memory,
        };
      }
    }

    return result;
  }

  private async execute(
    code: string,
    _language: string,
    input: string,
    timeLimit: number
  ): Promise<JudgeResult> {
    const { baseUrl, token, languageId } = this.cfg;

    if (!baseUrl || !token) {
      return {
        status: "CE",
        stdout: "",
        stderr: "Judge0 未配置：缺少 baseUrl 或 token",
        time: 0,
        memory: 0,
      };
    }

    // SSRF protection: validate endpoint URL
    if (!isSafeImageUrl(baseUrl)) {
      console.error("[Judge0] Blocked SSRF attempt to:", baseUrl);
      return {
        status: "CE",
        stdout: "",
        stderr: "判题服务配置错误",
        time: 0,
        memory: 0,
      };
    }

    let hostname: string;
    try {
      hostname = new URL(baseUrl).hostname;
    } catch {
      return {
        status: "CE",
        stdout: "",
        stderr: "Judge0 baseUrl 格式错误",
        time: 0,
        memory: 0,
      };
    }

    // Step 1: Submit
    const submitRes = await fetch(`${baseUrl}/submissions?base64_encoded=true&wait=false`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": token,
        "X-RapidAPI-Host": hostname,
      },
      body: JSON.stringify({
        source_code: utf8ToBase64(code),
        language_id: languageId,
        stdin: utf8ToBase64(input),
        cpu_time_limit: timeLimit,
        memory_limit: this.cfg.memoryLimit * 1000, // KB
      }),
    });

    if (!submitRes.ok) {
      console.error(`[Judge0] API error: ${submitRes.status}`);
      return {
        status: "CE",
        stdout: "",
        // CVE-14: 不向用户暴露内部架构信息
        stderr: "判题服务暂时不可用",
        time: 0,
        memory: 0,
      };
    }

    const submitData = (await submitRes.json()) as { token?: string };
    const submissionToken = submitData.token;
    if (!submissionToken) {
      return {
        status: "CE",
        stdout: "",
        stderr: "Judge0 返回了无效的提交令牌",
        time: 0,
        memory: 0,
      };
    }

    // Step 2: Poll result
    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 500));
      const res = await fetch(
        `${baseUrl}/submissions/${submissionToken}?base64_encoded=true&fields=stdout,stderr,status,time,memory`,
        {
          headers: {
            "X-RapidAPI-Key": token,
            "X-RapidAPI-Host": hostname,
          },
        }
      );

      if (!res.ok) {
        attempts++;
        continue;
      }

      const data = (await res.json()) as {
        stdout: string | null;
        stderr: string | null;
        status: { id: number; description: string } | null;
        time: string;
        memory: number;
      };

      // Status id: 1=In Queue, 2=Processing
      if (!data.status || data.status.id <= 2) {
        attempts++;
        continue;
      }

      const stdout = base64ToUtf8(data.stdout);
      const stderr = base64ToUtf8(data.stderr);

      const status = this.mapStatus(data.status.id);
      const time = parseFloat(data.time || "0") * 1000;

      return {
        status,
        stdout,
        stderr,
        time,
        memory: data.memory || 0,
      };
    }

    console.error("[Judge0] timeout: result not available");
    return {
      status: "RE",
      stdout: "",
      stderr: "判题超时",
      time: 0,
      memory: 0,
    };
  }

  private mapStatus(id: number): JudgeStatus {
    const map: Record<number, JudgeStatus> = {
      3: "AC",   // Accepted
      4: "WA",   // Wrong Answer
      5: "TLE",  // Time Limit Exceeded
      6: "CE",   // Compilation Error
      7: "RE",   // Runtime Error (SIGSEGV)
      8: "RE",   // Runtime Error (SIGXFSZ)
      9: "RE",   // Runtime Error (SIGFPE)
      10: "RE",  // Runtime Error (SIGABRT)
      11: "RE",  // Runtime Error (NZEC)
      12: "RE",  // Runtime Error (Other)
      13: "TLE", // Internal Error -> treat as TLE
    };
    return map[id] || "RE";
  }
}
