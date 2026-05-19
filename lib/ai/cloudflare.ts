// undici is bundled with Node.js 18+ and available in Next.js server context.
// We use it directly so we can attach a ProxyAgent when HTTPS_PROXY is set —
// the built-in global fetch (also undici) does not honour proxy env vars.
import { fetch as undiciFetch, ProxyAgent } from "undici";

const CF_BASE = "https://api.cloudflare.com/client/v4/accounts";

export interface CFMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CFTextResponse {
  result: { response: string };
  success: boolean;
  errors: { message: string }[];
}

function makeDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY  || process.env.http_proxy;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

/**
 * Call Cloudflare Workers AI text generation.
 * Requires CF_ACCOUNT_ID and CF_AI_TOKEN in .env / .env.local.
 */
export async function runCFModel(
  model: string,
  messages: CFMessage[],
  options: { max_tokens?: number } = {}
): Promise<string> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token     = process.env.CF_AI_TOKEN;

  if (!accountId || !token) {
    throw new Error("CF_ACCOUNT_ID and CF_AI_TOKEN must be set in .env.local");
  }

  const url        = `${CF_BASE}/${accountId}/ai/run/${model}`;
  const dispatcher = makeDispatcher();

  const res = await undiciFetch(url, {
    ...(dispatcher ? { dispatcher } : {}),
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      max_tokens: options.max_tokens ?? 300,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudflare AI HTTP ${res.status}: ${body}`);
  }

  const data = await res.json() as CFTextResponse;

  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? "Unknown Cloudflare AI error";
    throw new Error(msg);
  }

  return data.result.response.trim();
}
