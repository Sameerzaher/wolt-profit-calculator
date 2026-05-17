const HEBREW_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9"
};

const HEBREW_LETTER_DIGITS: Record<string, string> = {
  "א": "",
  "ב": "",
  "ג": "",
  "ד": "",
  "ה": "",
  "ו": "",
  "ז": "",
  "ח": "",
  "ט": "",
  "י": "",
  "כ": "",
  "ל": "",
  "מ": "",
  "נ": "",
  "ס": "",
  "ע": "",
  "פ": "",
  "צ": "",
  "ק": "",
  "ר": "",
  "ש": "",
  "ת": ""
};

/** Normalize OCR output for Hebrew + English parsing. */
export function normalizeOcrText(text: string): string {
  let out = text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[״׳"]/g, "'")
    .replace(/[–—]/g, "-");

  for (const [from, to] of Object.entries(HEBREW_DIGITS)) {
    out = out.split(from).join(to);
  }

  out = out
    .replace(/₪\s*/g, "₪ ")
    .replace(/\s+/g, " ")
    .trim();

  return out;
}

export function normalizeLines(text: string): string[] {
  return normalizeOcrText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
