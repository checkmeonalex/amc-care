import { fetch as undiciFetch, ProxyAgent } from "undici";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.1-8b-instant";

export type ExplainResult = {
  explanation: string; // raw tagged string
  model: string;
};

const SYSTEM_PROMPT = `You explain lab results like a kind doctor talking to a 5th grader. Simple words, short sentences. Use ONLY these tags — nothing outside them.

<overview>
Three short paragraphs separated by a blank line:

Paragraph 1 — Good news: Name 2-3 things that look healthy. Keep it encouraging. Example: "Your liver and kidneys are working perfectly — that's great news!"

Paragraph 2 — What needs attention: Explain each problem in plain everyday words. Use comparisons like "think of red blood cells as tiny delivery trucks carrying oxygen — yours are running low, so you feel tired." Do NOT list test numbers here — just explain what is happening in the body and how it might make the person feel.

Paragraph 3 — Why it matters: One or two sentences on what these problems together mean for the person's daily life and energy.
</overview>

<insight>Two short sentences: first, what they should do (see a doctor urgently / book a routine check-up). Second, one simple thing they can start doing today — eat iron-rich foods, rest more, drink water, etc.</insight>

<section label="SECTION NAME">Only sections with flagged values.</section>
<abnormal>**Test: Value Unit** (ref: Range) — one plain sentence: what this number means and a common cause.</abnormal>
<critical>**Test: Value Unit** (ref: Range) — URGENT: what this means and what to do right away.</critical>

Rules: bold test names/values with **text** in abnormal/critical only. No markdown headers. No bullet points. Warm and human tone.`;

function makeDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY  || process.env.http_proxy;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

export async function explainLabResults(visionText: string): Promise<ExplainResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const dispatcher = makeDispatcher();

  const res = await undiciFetch(GROQ_URL, {
    ...(dispatcher ? { dispatcher } : {}),
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: visionText.slice(0, 1800) },
      ],
      temperature: 0.2,
      max_tokens:  1200,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq HTTP ${res.status}: ${text}`);
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[];
  };

  const explanation = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { explanation, model: MODEL };
}
