import type { CalculatorInput } from "./types";

const MESSAGES = {
  price: "\u05d4\u05d6\u05df \u05de\u05d7\u05d9\u05e8 \u05ea\u05e7\u05d9\u05df (\u05de\u05e1\u05e4\u05e8 \u05d7\u05d9\u05d5\u05d1\u05d9).",
  distanceKm:
    "\u05d4\u05d6\u05df \u05de\u05e8\u05d7\u05e7 \u05d1\u05e7\u05f4\u05de (\u05de\u05e1\u05e4\u05e8 \u05d2\u05d3\u05d5\u05dc \u05de-0).",
  minutes:
    "\u05d0\u05dd \u05de\u05de\u05dc\u05d9\u05dd \u2014 \u05d4\u05d6\u05df \u05d3\u05e7\u05d5\u05ea (\u05de\u05e1\u05e4\u05e8 \u05d2\u05d3\u05d5\u05dc \u05de-0).",
  cashTip: "\u05d4\u05d6\u05df \u05d8\u05d9\u05e4 \u05de\u05d6\u05d5\u05de\u05df \u05ea\u05e7\u05d9\u05df (\u05d0\u05d5 0)."
} as const;

function isValidOptionalMinutes(n: number | null): boolean {
  if (n === null) return true;
  return Number.isFinite(n) && n > 0;
}

/**
 * Validates calculator fields. Minutes and tip are optional but must be sensible when present.
 */
export function validateCalculatorInput(input: CalculatorInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.push(MESSAGES.price);
  }
  if (!Number.isFinite(input.distanceKm) || input.distanceKm <= 0) {
    errors.push(MESSAGES.distanceKm);
  }
  if (!isValidOptionalMinutes(input.estimatedMinutes)) {
    errors.push(MESSAGES.minutes);
  }
  if (!Number.isFinite(input.cashTip) || input.cashTip < 0) {
    errors.push(MESSAGES.cashTip);
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
