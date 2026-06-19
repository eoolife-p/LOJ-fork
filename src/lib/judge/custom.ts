import type { IJudgeEngine, JudgeResult } from "./types";
import type { JudgeConfig } from "@/config/judge";

/**
 * 自定义判题引擎
 * 通过 new Function 动态执行用户代码，返回一个实现了 IJudgeEngine 的对象
 * 注意：此功能仅限管理员使用，代码在受限上下文中执行
 */
export class CustomJudgeEngine implements IJudgeEngine {
  private impl: IJudgeEngine;

  constructor(config: JudgeConfig) {
    const code = config.customCode;
    if (!code || code.trim().length === 0) {
      throw new Error("自定义引擎代码为空");
    }

    // Sandbox: pass useful APIs without exposing dangerous globals
    const sandbox = {
      fetch,
      console,
      Promise,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Math,
      JSON,
      Date,
      String,
      Number,
      Boolean,
      Array,
      Object,
      RegExp,
      Error,
      Map,
      Set,
      parseInt,
      parseFloat,
      isNaN,
      encodeURIComponent,
      decodeURIComponent,
    };

    const keys = Object.keys(sandbox);
    const fn = new Function(
      ...keys,
      `"use strict";
var globalThis=undefined;var global=undefined;var process=undefined;var require=undefined;var __dirname=undefined;var __filename=undefined;var module=undefined;var exports={};
${code}
;return typeof engine !== 'undefined' ? engine : typeof exports !== 'undefined' && exports.default ? exports.default : exports;`
    );

    const values = keys.map((k) => (sandbox as Record<string, unknown>)[k]);
    const result = fn(...values);

    if (!result || typeof result !== "object") {
      throw new Error("自定义引擎必须返回一个对象");
    }

    if (typeof result.submit !== "function" || typeof result.run !== "function") {
      throw new Error("自定义引擎必须实现 submit 和 run 方法");
    }

    this.impl = result as IJudgeEngine;
  }

  async run(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult> {
    return this.impl.run(code, language, input, timeLimit, memoryLimit);
  }

  async submit(
    code: string,
    language: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<JudgeResult> {
    return this.impl.submit(code, language, input, expectedOutput, timeLimit, memoryLimit);
  }

  async judgeWithSPJ(
    spjCode: string,
    spjLanguage: string,
    input: string,
    userOutput: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<{ status: "AC" | "WA"; message: string }> {
    if (typeof (this.impl as any).judgeWithSPJ === "function") {
      return (this.impl as any).judgeWithSPJ(spjCode, spjLanguage, input, userOutput, expectedOutput, timeLimit, memoryLimit);
    }
    const ok = userOutput.trim() === expectedOutput.trim();
    return { status: ok ? "AC" : "WA", message: ok ? "" : "自定义引擎不支持 SPJ" };
  }
}
