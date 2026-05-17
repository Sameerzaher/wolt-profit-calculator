import type { OcrExtractionDraft } from "@/types/ocr";
import { fieldConfidence, overallConfidence } from "@/utils/ocr/confidence";
import {
  parseBonuses,
  parseDate,
  parseDeliveries,
  parseDurationHours,
  parseTimeRange,
  pickIncomeAmount,
  durationToEndTime
} from "@/utils/ocr/parsers/common";
import { getTodayKey } from "@/utils/dates";

const INCOME_KEYWORDS = [
  /הכנסה/i,
  /סה.?כ/i,
  /רווח/i,
  /earnings/i,
  /total/i,
  /today/i,
  /היום/i,
  /wolt/i
];

const DELIVERY_KEYWORDS = [/משלוח/i, /deliver/i, /orders/i, /tasks/i, /הזמנ/i];

export function parseWoltScreenshot(rawText: string): OcrExtractionDraft {
  const income = pickIncomeAmount(rawText, INCOME_KEYWORDS);
  const deliveries = parseDeliveries(rawText, DELIVERY_KEYWORDS);
  const bonuses = parseBonuses(rawText);
  const date = parseDate(rawText);
  const duration = parseDurationHours(rawText);
  const timeRange = parseTimeRange(rawText);

  const startTime = timeRange?.startTime ?? "09:00";
  const durationHours = duration?.value ?? (timeRange ? estimateHours(timeRange.startTime, timeRange.endTime, timeRange.endsNextDay) : 3);
  const endTime =
    timeRange?.endTime ?? durationToEndTime(startTime, durationHours, timeRange?.endsNextDay ?? false);
  const endsNextDay = timeRange?.endsNextDay ?? false;

  const totalIncome = roundIncome((income?.value ?? 0) + (bonuses?.value ?? 0));

  const fields = [
    fieldConfidence("income", income?.confidence ?? 0.15, income?.hint ?? "לא זוהתה הכנסה — הזינו ידנית"),
    fieldConfidence("bonuses", bonuses?.confidence ?? 0.2, bonuses?.hint ?? "בונוס"),
    fieldConfidence("deliveriesCount", deliveries?.confidence ?? 0.2, deliveries?.hint ?? "משלוחים"),
    fieldConfidence("date", date?.confidence ?? 0.25, date?.hint ?? "תאריך — ברירת מחדל היום"),
    fieldConfidence("shiftDurationHours", duration?.confidence ?? 0.25, duration?.hint ?? "משך משמרת"),
    fieldConfidence("startTime", timeRange?.confidence ?? 0.3, timeRange?.hint ?? "שעת התחלה"),
    fieldConfidence("endTime", timeRange?.confidence ?? 0.3, timeRange?.hint ?? "שעת סיום")
  ];

  return {
    platform: "wolt",
    rawText,
    income: totalIncome,
    bonuses: bonuses?.value ?? 0,
    deliveriesCount: deliveries?.value ?? 1,
    date: date?.value ?? getTodayKey(),
    startTime,
    endTime,
    endsNextDay,
    shiftDurationHours: durationHours,
    kilometers: 0,
    fieldConfidences: fields,
    overallConfidence: overallConfidence(fields)
  };
}

function roundIncome(value: number): number {
  return Math.round(value * 100) / 100;
}

function estimateHours(start: string, end: string, overnight: boolean): number {
  const s = start.split(":").map(Number);
  const e = end.split(":").map(Number);
  if (s.length < 2 || e.length < 2) return 3;
  let startM = s[0] * 60 + s[1];
  let endM = e[0] * 60 + e[1];
  if (overnight || endM <= startM) endM += 24 * 60;
  return Math.max(0.5, Math.round(((endM - startM) / 60) * 100) / 100);
}
