import type { NextApiRequest, NextApiResponse } from "next";
import { fetch as undiciFetch, ProxyAgent } from "undici";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.1-8b-instant";

function makeDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY  || process.env.http_proxy;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, context } = req.body as {
    messages?: { role: string; content: string }[];
    context?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided" });
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content?.trim()) {
    return res.status(400).json({ error: "Empty message" });
  }
  if (lastMessage.content.length > 2000) {
    return res.status(400).json({ error: "Message too long" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Service unavailable" });

  const systemPrompt = `You are a warm, helpful medical assistant explaining lab results to a patient in plain everyday language — like a kind doctor talking to a 5th grader. Keep answers short (2-4 sentences). No markdown. No bullet points. Plain conversational text only.

Lab result context:
${context?.slice(0, 1500) ?? "No context provided."}`;

  const dispatcher = makeDispatcher();

  try {
    const r = await undiciFetch(GROQ_URL, {
      ...(dispatcher ? { dispatcher } : {}),
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        temperature: 0.3,
        max_tokens:  400,
      }),
    });

    const data = await r.json() as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "I couldn't generate a response.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[lab/chat]", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Failed to get a response. Please try again." });
  }
}
