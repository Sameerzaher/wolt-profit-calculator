import type { DeliveryTask, ShiftAnalysis, ShiftSession } from "@/types/models";
import { clamp, round2 } from "@/lib/utils";
import { calculateNetIncome, calculateRatePerHour, calculateRatePerKm, calculateVehicleCost } from "@/src/lib/calculations";
import { buildShiftInsights } from "@/src/lib/insights";

type ParsedRestaurant = {
  restaurant: string;
  area?: string;
  deliveriesCount: number;
};

const AMOUNT_REGEX = /(?:₪|NIS|ILS|(?:\bIS\b)|[A-Za-z])?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i;
const KM_REGEX = /([0-9]+(?:[.,][0-9]+)?)\s*km/i;
const TIME_REGEX = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
const DATE_TEXT_REGEX = /\b([0-3]?\d)\s+([A-Za-z]{3,9})\s+(20\d{2})\b/;
const MONTHS: Record<string, number> = {
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

export function parseTasksFromOcrText(text: string, sourceImageIndex: number): DeliveryTask[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tasks: DeliveryTask[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const amountMatch = lines[index].match(AMOUNT_REGEX);
    if (!amountMatch) continue;
    if (!looksLikeAmountLine(lines[index])) continue;

    const amountIls = toNumber(amountMatch[1]);
    if (!Number.isFinite(amountIls)) continue;

    const contextLines = lines.slice(Math.max(0, index - 4), index + 1);
    const taskOfferLine = [...contextLines].reverse().find((line) => /task offer/i.test(line));
    const restaurantLine = findRestaurantLine(contextLines);

    const parsedRestaurant = parseRestaurantLine(restaurantLine);
    const distanceKm = taskOfferLine ? parseDistance(taskOfferLine) : undefined;
    const time = parseTimeFromLines(contextLines);

    tasks.push({
      id: `${sourceImageIndex}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      restaurant: parsedRestaurant.restaurant ?? "לא ידוע",
      area: parsedRestaurant.area,
      time,
      distanceKm,
      amountIls: round2(amountIls),
      deliveriesCount: parsedRestaurant.deliveriesCount,
      sourceImageIndex,
      source: "ocr"
    });
  }

  return tasks;
}

function findRestaurantLine(contextLines: string[]): string | undefined {
  let taskOfferAt = -1;
  for (let i = contextLines.length - 1; i >= 0; i -= 1) {
    if (/task offer/i.test(contextLines[i])) {
      taskOfferAt = i;
      break;
    }
  }

  if (taskOfferAt > 0) {
    for (let i = taskOfferAt - 1; i >= 0; i -= 1) {
      const candidate = contextLines[i].trim();
      if (!candidate) continue;
      if (/deliveries/i.test(candidate)) continue;
      if (looksLikeAmountLine(candidate)) continue;
      if (/task offer/i.test(candidate)) continue;
      return candidate;
    }
  }

  return [...contextLines]
    .reverse()
    .find((line) => line.includes("|") || /\(\d+\s*deliver/i.test(line));
}

function looksLikeAmountLine(line: string): boolean {
  const cleaned = line.trim();
  if (!cleaned) return false;
  if (/task offer/i.test(cleaned)) {
    return /([0-9]+(?:[.,][0-9]{1,2})?)\s*$/.test(cleaned);
  }
  if (/[a-z]/i.test(cleaned) && !/(₪|NIS|ILS|IS|[A-Za-z][0-9])/i.test(cleaned)) return false;
  return /([0-9]+(?:[.,][0-9]{1,2})?)\s*$/.test(cleaned);
}

export function buildShiftAnalysis(
  tasks: DeliveryTask[],
  actualDrivenKm?: number,
  costPerKm = 0.7,
  sessions: ShiftSession[] = []
): ShiftAnalysis {
  const grossIncome = round2(tasks.reduce((sum, task) => sum + task.amountIls, 0));
  const taskCount = tasks.length;
  const deliveryCount = tasks.reduce((sum, task) => sum + Math.max(1, task.deliveriesCount), 0);
  const totalOfferKm = round2(tasks.reduce((sum, task) => sum + (task.distanceKm ?? 0), 0));

  const taskTimes = tasks.map((task) => task.time).filter((value): value is string => Boolean(value));
  const sortedMinutes = taskTimes.map(toMinutes).filter((v): v is number => v !== null).sort((a, b) => a - b);

  const sessionSummary = summarizeSessions(sessions);
  const durationHours = sessionSummary.activeWorkHours ?? estimateDurationHours(sortedMinutes) ?? 0;
  const grossPerHour = calculateRatePerHour(grossIncome, durationHours) ?? 0;
  const grossPerKmByOffer = calculateRatePerKm(grossIncome, totalOfferKm);
  const vehicleCost = calculateVehicleCost(actualDrivenKm, costPerKm) ?? 0;
  const netIncome = calculateNetIncome(grossIncome, vehicleCost) ?? grossIncome;
  const netPerHour = calculateRatePerHour(netIncome, durationHours) ?? 0;
  const grossPerRealKm = calculateRatePerKm(grossIncome, actualDrivenKm);
  const netPerKm = calculateRatePerKm(netIncome, actualDrivenKm);
  const insights = buildShiftInsights(tasks, grossPerHour, grossPerRealKm);
  const rating = scoreShift(grossPerHour, grossPerKmByOffer, insights);

  return {
    grossIncome,
    netIncome,
    vehicleCost,
    taskCount,
    deliveryCount,
    actualDrivenKm,
    offerDistanceKm: totalOfferKm,
    activeHours: round2(durationHours),
    breakHours: round2(sessionSummary.breakHours ?? 0),
    grossPerHour: round2(grossPerHour),
    netPerHour: round2(netPerHour),
    grossPerKm: grossPerRealKm,
    netPerKm,
    rating,
    insights
  };
}

/** Quick summary from parsed tasks for UI hints before the user confirms calculations. */
export function summarizeTasksForOcrPreview(tasks: DeliveryTask[]): {
  timeRangeLabel: string | null;
  grossSum: number;
  taskCount: number;
  deliveryCount: number;
} {
  const grossSum = round2(tasks.reduce((sum, task) => sum + task.amountIls, 0));
  const taskCount = tasks.length;
  const deliveryCount = tasks.reduce((sum, task) => sum + Math.max(1, task.deliveriesCount), 0);
  const taskTimes = tasks.map((task) => task.time).filter((value): value is string => Boolean(value));
  const sortedMinutes = taskTimes.map(toMinutes).filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (sortedMinutes.length === 0) {
    return { timeRangeLabel: null, grossSum, taskCount, deliveryCount };
  }
  const first = sortedMinutes[0];
  const last = sortedMinutes[sortedMinutes.length - 1];
  return {
    timeRangeLabel: `${toTimeString(first)}–${toTimeString(last)}`,
    grossSum,
    taskCount,
    deliveryCount
  };
}

export function summarizeSessions(sessions: ShiftSession[]): {
  activeWorkHours?: number;
  breakHours?: number;
  sessionStartTime?: string;
  sessionEndTime?: string;
  hasLongWorkWarning?: boolean;
} {
  const normalized = sessions
    .map((session) => sessionToTimeline(session))
    .filter((session): session is { startMs: number; endMs: number } => session !== null)
    .sort((a, b) => a.startMs - b.startMs);

  if (normalized.length === 0) return {};

  const activeMinutes = normalized.reduce((sum, session) => sum + (session.endMs - session.startMs) / 1000 / 60, 0);
  let breakMinutes = 0;
  for (let i = 1; i < normalized.length; i += 1) {
    breakMinutes += Math.max(0, (normalized[i].startMs - normalized[i - 1].endMs) / 1000 / 60);
  }

  const firstStart = new Date(normalized[0].startMs);
  const lastEnd = new Date(normalized[normalized.length - 1].endMs);

  return {
    activeWorkHours: round2(activeMinutes / 60),
    breakHours: round2(breakMinutes / 60),
    sessionStartTime: `${pad2(firstStart.getHours())}:${pad2(firstStart.getMinutes())}`,
    sessionEndTime: `${pad2(lastEnd.getHours())}:${pad2(lastEnd.getMinutes())}`,
    hasLongWorkWarning: activeMinutes > 12 * 60
  };
}

export function validateSessions(sessions: ShiftSession[]): string[] {
  const issues: string[] = [];
  const normalized = sessions
    .map((session) => ({ session, timeline: sessionToTimeline(session) }))
    .filter((item) => item.timeline !== null) as Array<{
    session: ShiftSession;
    timeline: { startMs: number; endMs: number };
  }>;

  for (const item of normalized) {
    if (item.timeline.startMs === item.timeline.endMs) {
      issues.push("שעת סיום לא יכולה להיות זהה לשעת התחלה.");
    }
  }

  const sorted = [...normalized].sort((a, b) => a.timeline.startMs - b.timeline.startMs);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].timeline.startMs < sorted[i - 1].timeline.endMs) {
      issues.push("מקטעי עבודה חופפים זה לזה.");
      break;
    }
  }

  const summary = summarizeSessions(sessions);
  if (summary.hasLongWorkWarning) {
    issues.push("אזהרה: זמן עבודה נטו מעל 12 שעות.");
  }

  return [...new Set(issues)];
}

export function dedupeTasks(tasks: DeliveryTask[]): DeliveryTask[] {
  const seen = new Set<string>();
  const output: DeliveryTask[] = [];
  for (const task of tasks) {
    const key = [
      (task.restaurant ?? "").trim().toLowerCase(),
      task.time ?? "",
      task.amountIls.toFixed(2),
      task.distanceKm?.toFixed(2) ?? ""
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(task);
  }
  return output;
}

export function detectShiftDateFromText(text: string): string | undefined {
  const match = text.match(DATE_TEXT_REGEX);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = MONTHS[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !month || !Number.isFinite(year)) return undefined;
  if (day < 1 || day > 31) return undefined;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function scoreShift(grossPerHour: number | undefined, grossPerKm: number | undefined, insights: string[]): number {
  let score = 5;
  if (grossPerHour !== undefined) {
    if (grossPerHour > 80) score += 3;
    else if (grossPerHour > 60) score += 2;
    else if (grossPerHour > 45) score += 1;
    else score -= 1;
  }
  if (grossPerKm !== undefined) {
    if (grossPerKm > 5) score += 1;
    if (grossPerKm < 3) score -= 1;
  }
  if (insights.includes("נסעת יותר מדי")) score -= 1;
  return clamp(Math.round(score), 1, 10);
}

function parseRestaurantLine(line: string | undefined): ParsedRestaurant {
  if (!line) return { restaurant: "Unknown", deliveriesCount: 1 };

  const deliveriesMatch = line.match(/\((\d+)\s*deliver(?:y|ies)\)/i);
  const deliveriesCount = deliveriesMatch ? Number(deliveriesMatch[1]) : 1;

  const withoutTime = line.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, "").trim();
  const sanitized = withoutTime.replace(/\(\d+\s*deliver(?:y|ies)\)/i, "").trim();
  const [restaurantRaw, areaRaw] = sanitized.split("|").map((part) => part.trim());

  return {
    restaurant: restaurantRaw || "Unknown",
    area: areaRaw || undefined,
    deliveriesCount: Number.isFinite(deliveriesCount) ? deliveriesCount : 1
  };
}

function parseDistance(line: string): number | undefined {
  const match = line.match(KM_REGEX);
  if (!match) return undefined;
  const normalized = match[1].replace(/(\d):(\d)/g, "$1.$2");
  const value = toNumber(normalized);
  return Number.isFinite(value) ? round2(value) : undefined;
}

function parseTimeFromLines(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(TIME_REGEX);
    if (match) return `${pad2(Number(match[1]))}:${match[2]}`;
  }
  return undefined;
}

function estimateDurationHours(sortedMinutes: number[]): number | undefined {
  if (sortedMinutes.length < 2) return undefined;
  const first = sortedMinutes[0];
  const last = sortedMinutes[sortedMinutes.length - 1];
  const diff = last >= first ? last - first : 24 * 60 - first + last;
  if (diff <= 0) return undefined;
  return diff / 60;
}

function sessionToTimeline(session: ShiftSession): { startMs: number; endMs: number } | null {
  const startDate = parseDateOrTime(session.startDateTime);
  const endDateRaw = parseDateOrTime(session.endDateTime);
  if (!startDate || !endDateRaw) return null;

  const endDate = new Date(endDateRaw.getTime());
  const isTimeOnlyInput = isTimeOnly(session.startDateTime) || isTimeOnly(session.endDateTime);
  const isEarlier = endDate.getTime() < startDate.getTime();
  const shouldMoveToNextDay = Boolean(session.isOvernight) || isEarlier || (isTimeOnlyInput && endDate.getTime() <= startDate.getTime());

  if (shouldMoveToNextDay && endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return { startMs: startDate.getTime(), endMs: endDate.getTime() };
}

function toMinutes(time: string): number | null {
  const match = time.match(TIME_REGEX);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function parseDateOrTime(input: string): Date | null {
  if (!input) return null;
  if (isTimeOnly(input)) {
    const [hour, minute] = input.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isTimeOnly(value: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(value);
}

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
