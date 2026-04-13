import type { CalculatorInput } from "./types";

const MESSAGES = {
  price: "הזן מחיר תקין (מספר חיובי).",
  distanceKm: "הזן מרחק בק״מ (גדול מ־0).",
  minutes: "אם ממלאים דקות — השתמש במספר חיובי.",
  cashTip: "הזן טיפ במזומן תקין (או 0)."
} as const;

function isValidOptionalMinutes(n: number | null): boolean {
  if (n === null) return true;
  return Number.isFinite(n) && n > 0;
}

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
