import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIConfig } from "@/lib/ai-config";

function buildSystemPrompt(problem: {
  id: number;
  title: string;
  difficulty: string;
  description: string;
  inputDesc: string;
  outputDesc: string;
  sampleInput: string;
  sampleOutput: string;
  tags: string;
}) {
  const tags = (() => {
    try {
      return JSON.parse(problem.tags || "[]").join(", ");
    } catch {
      return "";
    }
  })();

  return `你是 LOJ 的 AI 编程助教。用户正在查看一道编程题，请基于以下题目信息回答问题：

【题目】${problem.id}. ${problem.title}
【难度】${problem.difficulty}
【标签】${tags}

【题目描述】
${problem.description}

【输入说明】
${problem.inputDesc}

【输出说明】
${problem.outputDesc}

【样例输入】
${problem.sampleInput}

【样例输出】
${problem.sampleOutput}

请用中文回答。对于代码题，请给出思路讲解而非完整代码（除非用户明确要求代码），并注意引导用户独立思考。`;
}

function sse(data: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { messages, problem, model: modelOverride, thinkEnabled } = (await request.json()) as {
    messages: Array<{ role: string; content: string }>;
    problem: Parameters<typeof buildSystemPrompt>[0];
    model?: string;
    thinkEnabled?: boolean;
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "消息格式错误" }, { status: 400 });
  }

  const config = await getAIConfig();
  if (!config.enabled || !config.apiKey) {
    return NextResponse.json(
      { error: "AI 功能未启用，请联系管理员配置 API Key" },
      { status: 503 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${config.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: modelOverride || config.model,
            messages: [
              { role: "system", content: buildSystemPrompt(problem) },
              ...messages
                .filter((m) => m.role !== "system")
                .map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            stream: true,
            chat_template_kwargs: { enable_thinking: !!thinkEnabled },
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          controller.enqueue(sse({ type: "error", text: `请求失败：HTTP ${res.status} ${err}` }));
          controller.close();
          return;
        }

        if (!res.body) {
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                controller.enqueue(sse({ type: "reasoning", text: delta.reasoning_content }));
              }
              if (delta?.content) {
                controller.enqueue(sse({ type: "content", text: delta.content }));
              }
            } catch {
              // ignore unparseable lines
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(sse({ type: "error", text: `请求失败：${msg}` }));
      } finally {
        controller.enqueue(sse({ type: "done" }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
