/**
 * Vision AI — Cloudflare Workers AI image analysis.
 *
 * Used by the hybrid OCR system when:
 *   • OCR confidence < 70 %   (extraction was uncertain)
 *   • Structured table layout detected  (lines method found a real table)
 *
 * Model: @cf/meta/llama-3.2-11b-vision-instruct
 * Requires a one-time license agreement per account — we send "agree" automatically.
 */

import { readFile } from "fs/promises";
import { fetch as undiciFetch, ProxyAgent } from "undici";

const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";
const CF_BASE      = "https://api.cloudflare.com/client/v4/accounts";

// ── Output type ───────────────────────────────────────────────────────────────

export type VisionResult = {
  text:  string;   // formatted plain-text summary from the model
  model: string;
};

// ── Prompt ────────────────────────────────────────────────────────────────────

const PROMPT = `Extract lab results. Output only:
PATIENT: Name|Date|Age|Sex
SECTION_NAME
TestName|Value|Unit|RefLow-RefHigh|H/L/C/N
...
REMARKS: text if any

H=high L=low C=critical N=normal. No prose. No extra text.`;

// ── Proxy helper ──────────────────────────────────────────────────────────────

function makeDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY  || process.env.http_proxy;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

// ── CF request helper ─────────────────────────────────────────────────────────

async function cfPost(
  url: string,
  token: string,
  dispatcher: ReturnType<typeof makeDispatcher>,
  body: unknown
): Promise<{ result?: { response?: string }; success?: boolean }> {
  const res = await undiciFetch(url, {
    ...(dispatcher ? { dispatcher } : {}),
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudflare Vision HTTP ${res.status}: ${text}`);
  }

  return res.json() as Promise<{ result?: { response?: string }; success?: boolean }>;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runVisionAnalysis(imagePath: string): Promise<VisionResult> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token     = process.env.CF_AI_TOKEN;

  if (!accountId || !token) {
    throw new Error("CF_ACCOUNT_ID and CF_AI_TOKEN must be set in .env.local");
  }

  const url        = `${CF_BASE}/${accountId}/ai/run/${VISION_MODEL}`;
  const dispatcher = makeDispatcher();

  const buf     = await readFile(imagePath);
  const base64  = buf.toString("base64");
  const ext     = imagePath.toLowerCase().endsWith(".png") ? "png" : "jpeg";
  const dataUrl = `data:image/${ext};base64,${base64}`;

  // Step 1 — accept the model license (prompt field, not messages)
  await cfPost(url, token, dispatcher, { prompt: "agree" }).catch(() => {});

  // Step 2 — send the vision request
  const data = await cfPost(url, token, dispatcher, {
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text",      text: PROMPT },
        ],
      },
    ],
    max_tokens: 1024,
  });

  const text = data.result?.response?.trim() ?? "";
  return { text, model: VISION_MODEL };
}
