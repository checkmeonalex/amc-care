import type { NextApiRequest, NextApiResponse } from "next";
import { explainLabResults, type ExplainResult } from "@/lib/ai/groq";

export type ExplainResponse = ExplainResult | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExplainResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    return res.status(400).json({ error: "No lab text provided" });
  }
  if (text.length > 20_000) {
    return res.status(400).json({ error: "Lab text too large" });
  }

  try {
    const result = await explainLabResults(text);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[lab/explain]", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Failed to generate explanation. Please try again." });
  }
}
