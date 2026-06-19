import type { IJudgeEngine, JudgeResult, JudgeStatus } from "./types";
import type { JudgeConfig } from "@/config/judge";
import { isSafeImageUrl } from "@/lib/security";

/**
 * OneCompiler 语言参数映射
 * 内部标识 → OneCompiler API 参数
 */
const LANG_MAP: Record<
  string,
  { mode: string; extension: string; language: string; fileName: string; referer: string }
> = {
  c: {
    mode: "c_cpp",
    extension: "c",
    language: "c",
    fileName: "Main.c",
    referer: "https://onecompiler.com/c",
  },
  cpp: {
    mode: "c_cpp",
    extension: "cpp",
    language: "cpp",
    fileName: "Main.cpp",
    referer: "https://onecompiler.com/cpp",
  },
  java: {
    mode: "java",
    extension: "java",
    language: "java",
    fileName: "Main.java",
    referer: "https://onecompiler.com/java",
  },
  python3: {
    mode: "python",
    extension: "py",
    language: "python",
    fileName: "main.py",
    referer: "https://onecompiler.com/python",
  },
  python2: {
    mode: "python",
    extension: "py",
    language: "python2",
    fileName: "main.py",
    referer: "https://onecompiler.com/python2",
  },
  go: {
    mode: "go",
    extension: "go",
    language: "go",
    fileName: "main.go",
    referer: "https://onecompiler.com/go",
  },
  csharp: {
    mode: "csharp",
    extension: "cs",
    language: "csharp",
    fileName: "main.cs",
    referer: "https://onecompiler.com/csharp",
  },
  php: {
    mode: "php",
    extension: "php",
    language: "php",
    fileName: "main.php",
    referer: "https://onecompiler.com/php",
  },
  javascript: {
    mode: "javascript",
    extension: "js",
    language: "nodejs",
    fileName: "main.js",
    referer: "https://onecompiler.com/javascript",
  },
  ruby: {
    mode: "ruby",
    extension: "rb",
    language: "ruby",
    fileName: "main.rb",
    referer: "https://onecompiler.com/ruby",
  },
  rust: {
    mode: "rust",
    extension: "rs",
    language: "rust",
    fileName: "main.rs",
    referer: "https://onecompiler.com/rust",
  },
};

export class OneCompilerEngine implements IJudgeEngine {
  private cfg: JudgeConfig["onecompiler"];
  private lastCallTime = 0;

  constructor(config?: JudgeConfig) {
    this.cfg = config?.onecompiler ?? {
      endpoint: "https://onecompiler.com/api/code/exec",
      timeLimit: 5,
    };
  }

  async run(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult> {
    return this.execute(code, language, input, timeLimit, memoryLimit);
  }

  async judgeWithSPJ(
    _spjCode: string,
    _spjLanguage: string,
    _input: string,
    userOutput: string,
    expectedOutput: string,
    _timeLimit: number,
    _memoryLimit: number
  ): Promise<{ status: "AC" | "WA"; message: string }> {
    const ok = userOutput.trim() === expectedOutput.trim();
    return { status: ok ? "AC" : "WA", message: ok ? "" : "OneCompiler 不支持 SPJ，请使用 Judge0" };
  }

  async submit(
    code: string,
    language: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult> {
    const result = await this.execute(code, language, input, timeLimit, memoryLimit);

    if (result.status === "AC") {
      const normalizedOutput = result.stdout.replace(/\r\n/g, "\n").trim();
      const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, "\n");
      if (normalizedOutput !== normalizedExpected) {
        return {
          ...result,
          status: "WA",
          stderr: `Expected:\n${normalizedExpected}\n\nGot:\n${normalizedOutput}`,
        };
      }
    }

    return result;
  }

  private getLangParams(language: string) {
    return LANG_MAP[language] ?? LANG_MAP["cpp"];
  }

  private async execute(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult> {
    // SSRF protection: validate endpoint URL
    if (!isSafeImageUrl(this.cfg.endpoint)) {
      console.error("[OneCompiler] Blocked SSRF attempt to:", this.cfg.endpoint);
      return {
        status: "CE",
        stdout: "",
        stderr: "判题服务配置错误",
        time: 0,
        memory: 0,
      };
    }

    try {
      // 限频：间隔至少 300ms
      const now = Date.now();
      const elapsed = now - this.lastCallTime;
      if (elapsed < 300) {
        await new Promise((r) => setTimeout(r, 300 - elapsed));
      }
      this.lastCallTime = Date.now();

      const lang = this.getLangParams(language);

      // 仅 C++ 有输入时注入头文件
      const fullCode = this.injectStdin(code, language, input);

      const body: Record<string, unknown> = {
        mode: lang.mode,
        extension: lang.extension,
        properties: {
          language: lang.language,
          files: [
            {
              name: lang.fileName,
              content: fullCode,
            },
          ],
          // 关键：把输入数据传给 API，否则 cin/scanf 等会因无输入而挂起超时
          stdin: input || "",
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        (timeLimit + 5) * 1000
      );

      let res: Response;
      try {
        res = await fetch(this.cfg.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://onecompiler.com",
            Referer: lang.referer,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (
          fetchErr instanceof DOMException &&
          fetchErr.name === "AbortError"
        ) {
          return {
            status: "TLE",
            stdout: "",
            stderr: "Time Limit Exceeded",
            time: timeLimit * 1000,
            memory: 0,
          };
        }
        throw fetchErr;
      }
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[OneCompiler] API error: ${res.status}`);
        return {
          status: "CE",
          stdout: "",
          // CVE-14: 不向用户暴露内部架构信息
          stderr: "判题服务暂时不可用",
          time: 0,
          memory: 0,
        };
      }

      const data = (await res.json()) as {
        exception: string | null;
        stdout: string | null;
        stderr: string | null;
        compilationTime: number;
        executionTime: number;
        memoryUsed: number;
        job?: { _id: string };
      };

      console.log("[OneCompiler] response:", JSON.stringify({
        exception: data.exception,
        stdout: data.stdout?.substring(0, 200),
        stderr: data.stderr?.substring(0, 200),
        compilationTime: data.compilationTime,
        executionTime: data.executionTime,
        memoryUsed: data.memoryUsed,
      }));

      const stdout = (data.stdout || "").replace(/\r\n/g, "\n");
      const stderr = (data.stderr || "").replace(/\r\n/g, "\n");
      const exception = data.exception || "";
      const executionTime = data.executionTime || 0;
      const memoryUsed = data.memoryUsed || 0;
      const compilationTime = data.compilationTime || 0;

      // 判断状态
      const status = this.resolveStatus(
        stdout,
        stderr,
        exception,
        executionTime,
        memoryUsed,
        timeLimit,
        memoryLimit
      );

      // OJ 判题只算运行时间，不算编译时间
      return {
        status,
        stdout: stdout.trim(),
        stderr:
          status === "AC"
            ? ""
            : [stderr, exception].filter(Boolean).join("\n").trim(),
        time: executionTime,
        memory: memoryUsed,
      };
    } catch (err) {
      console.error("[OneCompiler] request failed:", err);
      return {
        status: "RE",
        stdout: "",
        // CVE-14: 不向用户暴露内部架构信息
        stderr: "判题服务请求失败",
        time: 0,
        memory: 0,
      };
    }
  }

  /**
   * 注入 stdin 相关代码
   * 仅 C++ 需要处理：有输入时在代码前加 #include <cstddef>，无输入则原样发送
   */
  private injectStdin(code: string, language: string, input: string): string {
    if (language === "cpp" && input && input.trim().length > 0) {
      return "#include <cstddef>\n" + code;
    }
    return code;
  }

  /**
   * 根据 OneCompiler 返回结果判断判题状态
   */
  private resolveStatus(
    stdout: string,
    stderr: string,
    exception: string,
    executionTime: number,
    memoryUsed: number,
    timeLimit: number,
    memoryLimit: number
  ): JudgeStatus {
    // 有异常信息
    if (exception) {
      if (
        exception.includes("Time limit exceeded") ||
        exception.includes("timed out") ||
        exception.includes("Timeout")
      ) {
        return "TLE";
      }

      if (
        exception.includes("Compilation") ||
        exception.includes("compilation") ||
        exception.includes("error:") ||
        exception.includes("cannot find") ||
        exception.includes("undefined reference")
      ) {
        return "CE";
      }

      if (
        exception.includes("Segmentation fault") ||
        exception.includes("Runtime Error") ||
        exception.includes("Aborted") ||
        exception.includes("Exited with error")
      ) {
        return "RE";
      }

      return "RE";
    }

    // stderr 中有编译错误
    if (stderr) {
      if (
        stderr.includes("error:") ||
        stderr.includes("undefined reference") ||
        stderr.includes("ld returned")
      ) {
        return "CE";
      }

      if (
        stderr.includes("Segmentation fault") ||
        stderr.includes("Exited with error")
      ) {
        return "RE";
      }
    }

    // 检查是否超时（timeLimit 单位秒，executionTime 单位毫秒）
    if (executionTime > timeLimit * 1000) {
      return "TLE";
    }

    // 检查是否超内存（memoryLimit 单位 MB，memoryUsed 单位 KB）
    if (memoryUsed > memoryLimit * 1024) {
      return "MLE";
    }

    return "AC";
  }
}
