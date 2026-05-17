import { getTodayKey } from "@/utils/dates";
import { normalizeLines, normalizeOcrText, pad2, round2, toNumber } from "@/utils/ocr/textNormalize";

const TIME_REGEX = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/;
const ISO_DATE_REGEX = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
const DMY_DATE_REGEX = /\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/;
const DMY_SHORT_REGEX = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/;

const HEBREW_MONTHS: Record<string, number> = {
  "ינואר": 1,
  "פברואר": 2,
  "מרץ": 3,
  "מרס": 3,
  "אפריל": 4,
  "מאי": 5,
  "יוני": 6,
  "יולי": 7,
  "אוגוסט": 8,
  "ספטמבר": 9,
  "אוקטובר": 10,
  "נובמבר": 11,
  "דצמבר": 12
};

const EN_MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

export type MoneyMatch = { value: number; line: string; index: number; keyword?: string };

export function findMoneyAmounts(text: string): MoneyMatch[] {
  const lines = normalizeLines(text);
  const matches: MoneyMatch[] = [];

  const patterns = [
    /(?:₪|nis|ils|ש[\"']?ח)\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi,
    /([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:₪|nis|ils|ש[\"']?ח)/gi,
    /(?:^|\s)([0-9]{1,4}(?:[.,][0-9]{1,2})?)\s*$/i
  ];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(line)) !== null) {
        const value = toNumber(match[1]);
        if (value === null || value <= 0 || value > 50000) continue;
        matches.push({ value: round2(value), line, index, keyword: line.slice(0, 40) });
      }
    }
  });

  return matches;
}

export function pickIncomeAmount(
  text: string,
  keywords: RegExp[]
): { value: number; confidence: number; hint: string } | null {
  const lines = normalizeLines(text);
  let best: { value: number; confidence: number; hint: string } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const keywordHit = keywords.some((kw) => kw.test(line) || kw.test(lower));
    const amounts = findMoneyAmounts(line);
    for (const amount of amounts) {
      let confidence = 0.35;
      let hint = "סכום שזוהה בטקסט";
      if (keywordHit) {
        confidence = 0.88;
        hint = `ליד מילת מפתח: ${line.slice(0, 32)}`;
      } else if (/(total|earnings|income|הכנסה|סה.?כ|רווח|שכר|משכורת)/i.test(line)) {
        confidence = 0.82;
        hint = `שורת סיכום: ${line.slice(0, 32)}`;
      }
      if (!best || confidence > best.confidence || (confidence === best.confidence && amount.value > best.value)) {
        best = { value: amount.value, confidence, hint };
      }
    }
  }

  if (best) return best;

  const all = findMoneyAmounts(text);
  if (all.length === 0) return null;
  const largest = all.reduce((a, b) => (b.value > a.value ? b : a));
  return {
    value: largest.value,
    confidence: 0.42,
    hint: "הסכום הגבוה ביותר במסך (לא אומת מול מילת מפתח)"
  };
}

export function parseDeliveries(text: string, keywords: RegExp[]): { value: number; confidence: number; hint: string } | null {
  const normalized = normalizeOcrText(text);
  const patterns = [
    ...keywords.map((kw) => new RegExp(`${kw.source}\\D{0,12}([0-9]{1,3})`, "i")),
    /([0-9]{1,3})\s*(?:משלוחים|משלוח|הזמנות|deliver(?:y|ies)|orders)/i,
    /(?:משלוחים|משלוח|הזמנות|deliver(?:y|ies)|orders)\D{0,12}([0-9]{1,3})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0 && value <= 500) {
      return { value, confidence: 0.8, hint: "זוהה ליד מילת מפתח משלוחים" };
    }
  }
  return null;
}

export function parseBonuses(text: string): { value: number; confidence: number; hint: string } | null {
  const normalized = normalizeOcrText(text);
  const patterns = [
    /(?:בונוס|טיפים|תוספת|bonus|tips|incentive)\D{0,16}(?:₪|nis|ils)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:₪|nis|ils)\s*([0-9]+(?:[.,][0-9]{1,2})?)\D{0,8}(?:בונוס|טיפים|bonus|tips)/i
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const value = toNumber(match[1]);
    if (value !== null && value > 0) {
      return { value: round2(value), confidence: 0.78, hint: "בונוס / טיפים" };
    }
  }
  return { value: 0, confidence: 0.2, hint: "לא זוהה בונוס — אפשר להשאיר 0" };
}

export function parseDate(text: string): { value: string; confidence: number; hint: string } | null {
  const normalized = normalizeOcrText(text);

  const iso = normalized.match(ISO_DATE_REGEX);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const formatted = formatDate(y, m, d);
    if (formatted) return { value: formatted, confidence: 0.9, hint: "תאריך בפורמט ISO" };
  }

  const dmy = normalized.match(DMY_DATE_REGEX);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    const formatted = formatDate(y, m, d);
    if (formatted) return { value: formatted, confidence: 0.85, hint: "תאריך DD/MM/YYYY" };
  }

  const dmyShort = normalized.match(DMY_SHORT_REGEX);
  if (dmyShort) {
    const d = Number(dmyShort[1]);
    const m = Number(dmyShort[2]);
    const yy = Number(dmyShort[3]);
    const y = yy < 100 ? 2000 + yy : yy;
    const formatted = formatDate(y, m, d);
    if (formatted) return { value: formatted, confidence: 0.75, hint: "תאריך קצר" };
  }

  for (const [monthName, monthNum] of Object.entries(HEBREW_MONTHS)) {
    const re = new RegExp(`(\\d{1,2})\\s+${monthName}\\s+(20\\d{2})`, "i");
    const match = normalized.match(re);
    if (match) {
      const formatted = formatDate(Number(match[2]), monthNum, Number(match[1]));
      if (formatted) return { value: formatted, confidence: 0.82, hint: `תאריך עברי: ${monthName}` };
    }
  }

  const enDate = normalized.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/);
  if (enDate) {
    const month = EN_MONTHS[enDate[2].toLowerCase()];
    if (month) {
      const formatted = formatDate(Number(enDate[3]), month, Number(enDate[1]));
      if (formatted) return { value: formatted, confidence: 0.8, hint: "תאריך באנגלית" };
    }
  }

  if (/(היום|today)/i.test(normalized)) {
    return { value: getTodayKey(), confidence: 0.7, hint: "זוהה 'היום'" };
  }

  return null;
}

export function parseDurationHours(text: string): { value: number; confidence: number; hint: string } | null {
  const normalized = normalizeOcrText(text);

  const hebrewDur = normalized.match(/([0-9]+)\s*(?:שע(?:ות)?|ש['']?)\s*(?:ו\s*)?([0-9]{1,2})?\s*(?:דק(?:ות)?|ד['']?)?/i);
  if (hebrewDur) {
    const h = Number(hebrewDur[1]);
    const m = hebrewDur[2] ? Number(hebrewDur[2]) : 0;
    if (Number.isFinite(h)) {
      return { value: round2(h + m / 60), confidence: 0.85, hint: "משך בעברית (שעות ודקות)" };
    }
  }

  const hm = normalized.match(/([0-9]+)\s*(?:h|hr|hours?)\s*([0-9]{1,2})?\s*(?:m|min|minutes?)?/i);
  if (hm) {
    const h = Number(hm[1]);
    const m = hm[2] ? Number(hm[2]) : 0;
    return { value: round2(h + m / 60), confidence: 0.82, hint: "משך באנגלית" };
  }

  const colon = normalized.match(/\b([0-9]{1,2}):([0-5]\d)\s*(?:שעות|hours)?\b/i);
  if (colon) {
    return { value: round2(Number(colon[1]) + Number(colon[2]) / 60), confidence: 0.65, hint: "משך בפורמט H:MM" };
  }

  const online = normalized.match(
    /(?:online|active|זמן\s*פעיל|שעות\s*עבודה|משך)\D{0,20}([0-9]+)\s*(?:h|שע|שעות)/i
  );
  if (online) {
    const h = Number(online[1]);
    if (Number.isFinite(h) && h > 0 && h < 24) {
      return { value: h, confidence: 0.72, hint: "שעות פעילות / אונליין" };
    }
  }

  return null;
}

export function parseTimeRange(text: string): {
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
  confidence: number;
  hint: string;
} | null {
  const lines = normalizeLines(text);
  const times: string[] = [];

  for (const line of lines) {
    const matches = line.match(new RegExp(TIME_REGEX.source, "g"));
    if (matches) {
      for (const raw of matches) {
        const parsed = parseTimeToken(raw);
        if (parsed) times.push(parsed);
      }
    }
  }

  if (times.length >= 2) {
    const startTime = times[0];
    const endTime = times[times.length - 1];
    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    const endsNextDay = startM !== null && endM !== null && endM <= startM;
    return {
      startTime,
      endTime,
      endsNextDay,
      confidence: 0.75,
      hint: "טווח שעות מזוהה במסך"
    };
  }

  if (times.length === 1) {
    return {
      startTime: times[0],
      endTime: addHoursToTime(times[0], 3),
      endsNextDay: false,
      confidence: 0.45,
      hint: "זמן התחלה בלבד — סיום משוער"
    };
  }

  return null;
}

export function parseTimeToken(raw: string): string | null {
  const match = raw.match(TIME_REGEX);
  if (!match) return null;
  return `${pad2(Number(match[1]))}:${match[2]}`;
}

export function toMinutes(time: string): number | null {
  const match = time.match(TIME_REGEX);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addHoursToTime(time: string, hours: number): string {
  const mins = toMinutes(time);
  if (mins === null) return "12:00";
  const total = (mins + Math.round(hours * 60)) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function durationToEndTime(startTime: string, durationHours: number, endsNextDay: boolean): string {
  const startM = toMinutes(startTime);
  if (startM === null) return "12:00";
  const add = Math.round(durationHours * 60);
  let endM = startM + add;
  if (endsNextDay && endM < startM) endM += 24 * 60;
  endM = endM % (24 * 60);
  return `${pad2(Math.floor(endM / 60))}:${pad2(endM % 60)}`;
}

function formatDate(year: number, month: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
