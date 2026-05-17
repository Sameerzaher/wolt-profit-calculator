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

const INCOME_KEYWORDS = [/ten\s*bis/i, /10\s*bis/i, /הכנסה/i, /סה.?כ/i, /שכר/i, /רווח/i, /total/i, /earnings/i];
const DELIVERY_KEYWORDS = [/משלוח/i, /הזמנ/i, /deliver/i, /orders/i];

export function parseTenBisScreenshot(rawText: string): OcrExtractionDraft {
  const income = pickIncomeAmount(rawText, INCOME_KEYWORDS);
  const deliveries = parseDeliveries(rawText, DELIVERY_KEYWORDS);
  const bonuses = parseBonuses(rawText);
  const date = parseDate(rawText);
  const duration = parseDurationHours(rawText);
  const timeRange = parseTimeRange(rawText);

  const startTime = timeRange?.startTime ?? "10:00";
  const durationHours = duration?.value ?? 4;
  const endTime = timeRange?.endTime ?? durationToEndTime(startTime, durationHours, false);

  const fields = [
    fieldConfidence("income", income?.confidence ?? 0.15, income?.hint ?? "הכנסה"),
    fieldConfidence("bonuses", bonuses?.confidence ?? 0.2, bonuses?.hint ?? "בונוס"),
    fieldConfidence("deliveriesCount", deliveries?.confidence ?? 0.2, deliveries?.hint ?? "משלוחים"),
    fieldConfidence("date", date?.confidence ?? 0.25, date?.hint ?? "תאריך"),
    fieldConfidence("shiftDurationHours", duration?.confidence ?? 0.25, duration?.hint ?? "משך"),
    fieldConfidence("startTime", timeRange?.confidence ?? 0.3, timeRange?.hint ?? "התחלה"),
    fieldConfidence("endTime", timeRange?.confidence ?? 0.3, timeRange?.hint ?? "סיום")
  ];

  return {
    platform: "tenbis",
    rawText,
    income: Math.round(((income?.value ?? 0) + (bonuses?.value ?? 0)) * 100) / 100,
    bonuses: bonuses?.value ?? 0,
    deliveriesCount: deliveries?.value ?? 1,
    date: date?.value ?? getTodayKey(),
    startTime,
    endTime,
    endsNextDay: timeRange?.endsNextDay ?? false,
    shiftDurationHours: durationHours,
    kilometers: 0,
    fieldConfidences: fields,
    overallConfidence: overallConfidence(fields)
  };
}
