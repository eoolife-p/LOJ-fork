/** 判题状态枚举 */
export type JudgeStatus = "AC" | "PAC" | "WA" | "CE" | "RE" | "TLE" | "MLE";

/** 统一判题结果 */
export interface JudgeResult {
  status: JudgeStatus;
  stdout: string;
  stderr: string;
  time: number;   // ms
  memory: number; // KB
}

/** 判题引擎接口 —— 所有引擎必须实现此接口 */
export interface IJudgeEngine {
  /** 提交代码并返回判题结果 */
  submit(
    code: string,
    language: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult>;

  /** 仅运行代码，不做输出比对，不保存记录 */
  run(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult>;

  judgeWithSPJ(
    spjCode: string,
    spjLanguage: string,
    input: string,
    userOutput: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<{ status: "AC" | "WA"; message: string }>;
}
