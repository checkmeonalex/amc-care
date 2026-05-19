import type { NextApiRequest, NextApiResponse } from "next";
import { generateBPSummary, type BPSummaryInput } from "@/lib/ai";

export type BPSummaryResponse =
  | { summary: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BPSummaryResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<BPSummaryInput>;

  if (
    typeof body.sys !== "number" ||
    typeof body.dia !== "number" ||
    typeof body.qualityLabel !== "string" ||
    typeof body.categoryKey !== "string" ||
    typeof body.categoryLabel !== "string" ||
    typeof body.reliability !== "number" ||
    typeof body.readingsTotal !== "number" ||
    typeof body.readingsUsed !== "number"
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const summary = await generateBPSummary(body as BPSummaryInput);
    return res.status(200).json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[bp-summary]", message);
    return res.status(500).json({ error: message });
  }
}
