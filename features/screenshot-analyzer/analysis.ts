import type { DeliveryTask, ShiftAnalysis } from "@/types/models";
import { clamp, round2 } from "@/lib/utils";

type ParsedRestaurant = {
  restaurant: string;
  area?: string;
  deliveriesCount: number;
};

const AMOUNT_REGEX = /₪\s*([0-9]+(?:[.,][0-9]{1,2})?)/;
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

    const amountIls = toNumber(amountMatch[1]);
    if (!Number.isFinite(amountIls)) continue;

    const contextLines = lines.slice(Math.max(0, index - 4), index + 1);
    const taskOfferLine = [...contextLines].reverse().find((line) => /task offer/i.test(line));
    const restaurantLine = [...contextLines]
      .reverse()
      .find((line) => line.includes("|") || /\(\d+\s*deliver/i.test(line));

    const parsedRestaurant = parseRestaurantLine(restaurantLine);
    const distanceKm = taskOfferLine ? parseDistance(taskOfferLine) : undefined;
    const time = parseTimeFromLines(contextLines);

    tasks.push({
      id: `${sourceImageIndex}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      restaurant: parsedRestaurant.restaurant ?? "Unknown",
      area: parsedRestaurant.area,
      time,
      distanceKm,
      amountIls: round2(amountIls),
      deliveriesCount: parsedRestaurant.deliveriesCount,
      sourceImageIndex
    });
  }

  return tasks;
}

export function buildShiftAnalysis(
  tasks: DeliveryTask[],
  actualDrivenKm?: number,
  costPerKm = 0.7
): ShiftAnalysis {
  const grossIncome = round2(tasks.reduce((sum, task) => sum + task.amountIls, 0));
  const taskCount = tasks.length;
  const deliveryCount = tasks.reduce((sum, task) => sum + Math.max(1, task.deliveriesCount), 0);
  const totalOfferKm = round2(tasks.reduce((sum, task) => sum + (task.distanceKm ?? 0), 0));

  const taskTimes = tasks.map((task) => task.time).filter((value): value is string => Boolean(value));
  const sortedMinutes = taskTimes.map(toMinutes).filter((v): v is number => v !== null).sort((a, b) => a - b);

  const durationHours = estimateDurationHours(sortedMinutes);
  const firstTime = sortedMinutes.length > 0 ? toTimeString(sortedMinutes[0]) : undefined;
  const lastTime = sortedMinutes.length > 0 ? toTimeString(sortedMinutes[sortedMinutes.length - 1]) : undefined;
  const grossPerHour = durationHours && durationHours > 0 ? round2(grossIncome / durationHours) : undefined;
  const grossPerKm = totalOfferKm > 0 ? round2(grossIncome / totalOfferKm) : undefined;

  const estimatedVehicleCost =
    actualDrivenKm !== undefined && Number.isFinite(actualDrivenKm)
      ? round2(Math.max(0, actualDrivenKm) * Math.max(0, costPerKm))
      : undefined;

  const estimatedNetIncome =
    estimatedVehicleCost !== undefined ? round2(grossIncome - estimatedVehicleCost) : undefined;
  const estimatedNetPerHour =
    estimatedNetIncome !== undefined && durationHours && durationHours > 0
      ? round2(estimatedNetIncome / durationHours)
      : undefined;

  const insights = buildInsights(tasks, grossPerHour, actualDrivenKm, grossIncome);
  const rating = scoreShift(grossPerHour, grossPerKm, insights);

  return {
    grossIncome,
    taskCount,
    deliveryCount,
    totalOfferKm,
    firstTime,
    lastTime,
    estimatedDurationHours: durationHours ? round2(durationHours) : undefined,
    grossPerHour,
    grossPerKm,
    estimatedVehicleCost,
    estimatedNetIncome,
    estimatedNetPerHour,
    rating,
    insights
  };
}

export function dedupeTasks(tasks: DeliveryTask[]): DeliveryTask[] {
  const seen = new Set<string>();
  const output: DeliveryTask[] = [];
  for (const task of tasks) {
    const key = [
      task.restaurant.trim().toLowerCase(),
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

function buildInsights(
  tasks: DeliveryTask[],
  grossPerHour: number | undefined,
  actualDrivenKm: number | undefined,
  grossIncome: number
): string[] {
  const insights: string[] = [];

  if (grossPerHour !== undefined) {
    if (grossPerHour > 70) insights.push("Strong shift");
    else if (grossPerHour >= 50) insights.push("Good shift");
    else if (grossPerHour < 45) insights.push("Weak shift");
  }

  if (actualDrivenKm !== undefined && actualDrivenKm > 0) {
    const ilsPerRealKm = grossIncome / actualDrivenKm;
    if (ilsPerRealKm > 4) insights.push("Good ₪/km");
    if (ilsPerRealKm < 3) insights.push("Too much driving");
  }

  const bestRestaurant = groupBest(tasks, (task) => task.restaurant);
  if (bestRestaurant) insights.push(`Top restaurant: ${bestRestaurant}`);

  const bestArea = groupBest(tasks, (task) => task.area ?? "Unknown area");
  if (bestArea && bestArea !== "Unknown area") insights.push(`Top area: ${bestArea}`);

  const bestBlock = getBestTimeBlock(tasks);
  if (bestBlock) insights.push(`Best time block: ${bestBlock}`);

  return insights;
}

function groupBest(tasks: DeliveryTask[], keySelector: (task: DeliveryTask) => string): string | undefined {
  const revenueByKey = new Map<string, number>();
  for (const task of tasks) {
    const key = keySelector(task).trim();
    if (!key) continue;
    revenueByKey.set(key, (revenueByKey.get(key) ?? 0) + task.amountIls);
  }
  const sorted = [...revenueByKey.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0];
}

function getBestTimeBlock(tasks: DeliveryTask[]): string | undefined {
  const blocks = new Map<string, number>();
  for (const task of tasks) {
    if (!task.time) continue;
    const minutes = toMinutes(task.time);
    if (minutes === null) continue;
    const startHour = Math.floor((minutes / 60) / 3) * 3;
    const label = `${pad2(startHour)}:00-${pad2((startHour + 3) % 24)}:00`;
    blocks.set(label, (blocks.get(label) ?? 0) + task.amountIls);
  }

  const sorted = [...blocks.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0];
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
  if (insights.includes("Too much driving")) score -= 1;
  return clamp(Math.round(score), 1, 10);
}

function parseRestaurantLine(line: string | undefined): ParsedRestaurant {
  if (!line) return { restaurant: "Unknown", deliveriesCount: 1 };

  const deliveriesMatch = line.match(/\((\d+)\s*deliver(?:y|ies)\)/i);
  const deliveriesCount = deliveriesMatch ? Number(deliveriesMatch[1]) : 1;

  const sanitized = line.replace(/\(\d+\s*deliver(?:y|ies)\)/i, "").trim();
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
  const value = toNumber(match[1]);
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

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
