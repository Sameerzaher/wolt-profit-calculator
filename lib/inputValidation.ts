import type { CalculatorInput } from "./types";

const MESSAGES = {
  payout: "הזן תשלום תקין (מספר חיובי).",
  minutes: "הזן זמן בדקות (מספר גדול מ־0).",
  km: "הזן מרחק בק״מ (מספר גדול מ־0)."
} as const;

/**
 * Validates raw numeric fields (not scoring fallbacks).
 * Used for Hebrew UX messages; scoring still clamps internally.
 */
export function validateCalculatorInput(input: CalculatorInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.payout) || input.payout < 0) {
    errors.push(MESSAGES.payout);
  }
  if (!Number.isFinite(input.minutes) || input.minutes <= 0) {
    errors.push(MESSAGES.minutes);
  }
  if (!Number.isFinite(input.km) || input.km <= 0) {
    errors.push(MESSAGES.km);
  }

  return errors;
}

export function parseMoney(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parseIntLoose(text: string): number | null {
  const t = text.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}
