import { runCFModel, type CFMessage } from "./cloudflare";

// Best general-purpose text model on Workers AI free tier
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export interface BPSummaryInput {
  sys: number;
  dia: number;
  pulse?: number;
  categoryKey: string;
  categoryLabel: string;
  reliability: number;
  qualityLabel: string;
  readingsTotal: number;
  readingsUsed: number;
}

const SYSTEM_PROMPT = `You are AMC Care's health assistant.

Write a short, friendly summary of the user's blood pressure result in plain everyday English.

Rules:
- Match your tone to the severity level provided — do not call a high or elevated reading "good", "fine", or "normal"
- For normal or low readings: sound reassuring
- For elevated or stage 1 readings: sound calm but honest — acknowledge the reading is above ideal
- For stage 2 or crisis readings: be clear and direct about the need to act, without being dramatic
- Sound calm, clear, and human
- Never sound robotic, dramatic, or overly clinical
- Avoid difficult medical words
- Do NOT repeat the result title already shown on screen
- Focus on what the numbers mean in simple practical terms
- Give simple next-step advice when appropriate
- Never claim to diagnose the user
- Avoid phrases like:
  - "confidence level"
  - "cardiovascular system"
  - "hypertensive"
  - "this may indicate"
  - "seek clinician interpretation"
- Keep the response under 190 words
- Bullet points are allowed for tips or short lists
- Keep formatting simple and easy to read
- Headings are not allowed
- When referring to the top or bottom number, always add (SYS) or (DIA) — for example: "your top (SYS) number" or "your bottom (DIA) number"
- Write naturally, not like a medical article`;

export async function generateBPSummary(
  input: BPSummaryInput
): Promise<string> {
  const pulseNote =
    input.pulse !== undefined ? `, pulse ${input.pulse} bpm` : "";

  const readingQuality =
    input.reliability >= 90
      ? "Excellent"
      : input.reliability >= 75
      ? "Good"
      : input.reliability >= 60
      ? "Fair"
      : "Needs another test";

  const userPrompt = `Blood pressure: ${input.sys}/${input.dia} mmHg${pulseNote}
Severity: ${input.categoryLabel} (${input.categoryKey})
Reading quality: ${readingQuality}
Quality note: ${input.qualityLabel}
Readings used: ${input.readingsUsed} of ${input.readingsTotal}

Write the summary.`;

  const messages: CFMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  // TODO: remove before shipping
  console.log("[bp-summary] system prompt:\n", SYSTEM_PROMPT);
  console.log("[bp-summary] user prompt:\n", userPrompt);

  const raw = await runCFModel(MODEL, messages, {
    max_tokens: 200,
  });
  return cleanAIResponse(raw);
}

function cleanAIResponse(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^"([\s\S]*)"$/, "$1")
    .trim();
}