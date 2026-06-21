const WEBHOOK_TIMEOUT = 5000;

export async function dispatchWebhooks(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const hooks = await prisma.webhook.findMany({ where: { enabled: true } });

    for (const hook of hooks) {
      let events: string[];
      try { events = JSON.parse(hook.events); } catch { continue; }
      if (!events.includes(event)) continue;

      fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Secret": hook.secret || "",
        },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT),
      }).catch(() => {});
    }
  } catch {}
}
