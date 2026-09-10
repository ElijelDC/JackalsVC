import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { amountsMatch } from "@/lib/payment-match";
import type { TrainingPaygAiDecision } from "@/lib/player-payment-type";

export type TrainingPaygReceiptAiResult = {
  decision: TrainingPaygAiDecision;
  extractedAmount: number | null;
  notes: string | null;
};

function parseAmountFromText(text: string): number | null {
  const match = text.match(/(?:€|EUR|euro)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (!match?.[1]) return null;
  const normalized = match[1].replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseModelJson(content: string): {
  amount: number | null;
  confidence: "high" | "medium" | "low";
  notes?: string;
} | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    const parsed = JSON.parse(raw) as {
      amount?: unknown;
      confidence?: unknown;
      notes?: unknown;
    };
    const amount =
      typeof parsed.amount === "number"
        ? parsed.amount
        : typeof parsed.amount === "string"
          ? parseAmountFromText(parsed.amount)
          : null;
    const confidence =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : "low";
    return {
      amount,
      confidence,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    };
  } catch {
    const amount = parseAmountFromText(trimmed);
    if (amount == null) return null;
    return { amount, confidence: "low", notes: "Could not parse structured AI response" };
  }
}

async function loadImageAsDataUrl(proofScreenshotUrl: string): Promise<string | null> {
  try {
    const relative = proofScreenshotUrl.replace(/^\//, "");
    const absolute = path.join(process.cwd(), "public", relative);
    const buffer = await readFile(absolute);
    const extension = path.extname(absolute).toLowerCase().replace(".", "");
    const mime =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : extension === "gif"
            ? "image/gif"
            : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("[training-payg-ai] failed to read proof image", error);
    return null;
  }
}

/**
 * Vision check: extract euro amount from receipt screenshot and compare to fee.
 * Without OPENAI_API_KEY → UNSURE (admin review).
 */
export async function analyzeTrainingPaygReceipt(input: {
  proofScreenshotUrl: string;
  expectedAmountEur: number;
}): Promise<TrainingPaygReceiptAiResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      decision: "UNSURE",
      extractedAmount: null,
      notes: "OPENAI_API_KEY not configured — sent to admin review",
    };
  }

  const dataUrl = await loadImageAsDataUrl(input.proofScreenshotUrl);
  if (!dataUrl) {
    return {
      decision: "UNSURE",
      extractedAmount: null,
      notes: "Could not read uploaded receipt image",
    };
  }

  const model =
    process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  const expectedLabel = `€${input.expectedAmountEur.toFixed(2)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You verify Jackals VC Pay Per Training bank-transfer receipts. Each training session costs a fixed fee in euros (almost always €10.00). Extract the transferred amount from the screenshot. Reply with JSON only: {\"amount\": number|null, \"confidence\": \"high\"|\"medium\"|\"low\", \"notes\": string}. Prefer the main transfer/payment total (not fees, balances, or account numbers). Amount must be a euro number (e.g. 10 or 10.00). If the paid amount is unclear, set amount to null and confidence to low.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  `This receipt should show payment for one training session.`,
                  `Expected amount: exactly ${expectedLabel} (session fee).`,
                  `Extract the transferred amount visible on the receipt so we can confirm it matches ${expectedLabel}.`,
                ].join(" "),
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        "[training-payg-ai] OpenAI error",
        response.status,
        body.slice(0, 500),
      );
      return {
        decision: "UNSURE",
        extractedAmount: null,
        notes: `Vision API error (${response.status})`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = parseModelJson(content);
    if (!parsed || parsed.amount == null) {
      return {
        decision: "UNSURE",
        extractedAmount: null,
        notes: parsed?.notes ?? "Could not extract amount from receipt",
      };
    }

    // Server-side amount check is authoritative once the model extracts a number.
    if (amountsMatch(input.expectedAmountEur, parsed.amount)) {
      return {
        decision: "MATCH",
        extractedAmount: parsed.amount,
        notes: parsed.notes ?? `Matched expected ${expectedLabel}`,
      };
    }

    return {
      decision: "MISMATCH",
      extractedAmount: parsed.amount,
      notes:
        parsed.notes ??
        `Extracted €${parsed.amount.toFixed(2)} vs expected ${expectedLabel}`,
    };
  } catch (error) {
    console.error("[training-payg-ai] unexpected failure", error);
    return {
      decision: "UNSURE",
      extractedAmount: null,
      notes: "Vision check failed unexpectedly",
    };
  }
}

export function isTrainingPaygAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
