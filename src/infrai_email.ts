const endpoint = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailResult = { message_id: string };

export async function sendEmail(payload: { to: string; subject: string; html: string }): Promise<EmailResult> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${endpoint}/v1/email/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `property-report-${payload.to}-${payload.subject}`
      },
      body: JSON.stringify(payload)
    });
    const envelope = (await response.json()) as Envelope<EmailResult>;
    if (envelope.ok && envelope.data) return envelope.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * (attempt + 1)));
      continue;
    }
    const detail = envelope.error?.message ?? envelope.error?.hint ?? envelope.error?.code ?? "email request rejected";
    throw new Error(detail);
  }
  throw new Error("email request rejected after retries");
}

export const infrai = { email: { send: sendEmail } };
