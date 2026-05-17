import type { PlatformStats } from "@/types/analytics";
import type { ShiftDay, ShiftSegment } from "@/types/shift";
import type { VehicleSettings } from "@/types/vehicle";
import {
  calculateDailyTotals,
  calculateDuration,
  calculateFuelCost,
  calculateNetProfit,
  calculatePlatformPerformance,
  getFixedDailyCost,
  getMonthlyFixedTotal
} from "@/utils/calculations";
import { getTodayKey, isDateInRange, startOfWeek, toDateKey } from "@/utils/dates";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export type SegmentRow = { segment: ShiftSegment; dayDate: string };

export type DayOfWeekStats = {
  dayOfWeek: number;
  dayName: string;
  netProfit: number;
  hours: number;
  netPerHour: number;
  segmentCount: number;
};

export type HourBlockStats = {
  startHour: number;
  endHour: number;
  label: string;
  netPerHour: number;
  hours: number;
};

export type InsightContext = {
  shiftDays: ShiftDay[];
  vehicle: VehicleSettings;
  weekStart: string;
  weekEnd: string;
  lastWeekStart: string;
  lastWeekEnd: string;
  weekDays: ShiftDay[];
  lastWeekDays: ShiftDay[];
  allSegments: SegmentRow[];
  weekSegments: SegmentRow[];
  weekByPlatform: PlatformStats[];
  lastWeekByPlatform: PlatformStats[];
  weekTotals: ReturnType<typeof sumPeriod>;
  lastWeekTotals: ReturnType<typeof sumPeriod>;
  dayOfWeekStats: DayOfWeekStats[];
  hourBlocks: HourBlockStats[];
  heatmapBuckets: Map<string, { net: number; hours: number }>;
};

export function buildInsightContext(shiftDays: ShiftDay[], vehicle: VehicleSettings): InsightContext {
  const weekEnd = getTodayKey();
  const weekStart = startOfWeek();
  const lastWeekEndDate = new Date(weekStart);
  lastWeekEndDate.setDate(lastWeekEndDate.getDate() - 1);
  const lastWeekStartDate = new Date(lastWeekEndDate);
  lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 6);
  const lastWeekStart = toDateKey(lastWeekStartDate);
  const lastWeekEnd = toDateKey(lastWeekEndDate);

  const weekDays = shiftDays.filter((d) => d.segments.length > 0 && isDateInRange(d.date, weekStart, weekEnd));
  const lastWeekDays = shiftDays.filter((d) => d.segments.length > 0 && isDateInRange(d.date, lastWeekStart, lastWeekEnd));

  const allSegments = collectSegments(shiftDays);
  const weekSegments = collectSegments(weekDays);
  const weekByPlatform = calculatePlatformPerformance(weekDays, vehicle);
  const lastWeekByPlatform = calculatePlatformPerformance(lastWeekDays, vehicle);

  return {
    shiftDays,
    vehicle,
    weekStart,
    weekEnd,
    lastWeekStart,
    lastWeekEnd,
    weekDays,
    lastWeekDays,
    allSegments,
    weekSegments,
    weekByPlatform,
    lastWeekByPlatform,
    weekTotals: sumPeriod(weekDays, vehicle),
    lastWeekTotals: sumPeriod(lastWeekDays, vehicle),
    dayOfWeekStats: buildDayOfWeekStats(weekSegments, vehicle),
    hourBlocks: buildHourBlocks(weekSegments, vehicle),
    heatmapBuckets: buildHeatmapBuckets(weekSegments, vehicle)
  };
}

function sumPeriod(days: ShiftDay[], vehicle: VehicleSettings) {
  let income = 0;
  let net = 0;
  let hours = 0;
  let deliveries = 0;
  let fuel = 0;
  let km = 0;
  const activeDays = days.filter((d) => d.segments.length > 0).length;
  const fixed = getFixedDailyCost(vehicle) * activeDays;

  for (const day of days) {
    const s = calculateDailyTotals(day, vehicle);
    income += s.totalIncome;
    net += s.netProfit;
    hours += s.totalHours;
    deliveries += s.totalDeliveries;
    fuel += s.fuelCost;
    km += s.totalKilometers;
  }

  return {
    income: round2(income),
    net: round2(net),
    hours: round2(hours),
    deliveries,
    fuel: round2(fuel),
    fixed: round2(fixed),
    km: round2(km),
    activeDays,
    netPerHour: hours > 0 ? round2(net / hours) : 0,
    expenseRatio: income > 0 ? round2(((fuel + fixed) / income) * 100) : 0
  };
}

function buildDayOfWeekStats(segments: SegmentRow[], vehicle: VehicleSettings): DayOfWeekStats[] {
  const buckets = new Map<number, { net: number; hours: number; count: number }>();

  for (const { segment, dayDate } of segments) {
    const [y, m, d] = dayDate.split("-").map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    const h = calculateDuration(segment);
    if (h <= 0) continue;
    const fuel = calculateFuelCost(segment.kilometers, vehicle);
    const net = calculateNetProfit(segment.income, fuel);
    const prev = buckets.get(dow) ?? { net: 0, hours: 0, count: 0 };
    buckets.set(dow, { net: prev.net + net, hours: prev.hours + h, count: prev.count + 1 });
  }

  return Array.from(buckets.entries())
    .map(([dayOfWeek, data]) => ({
      dayOfWeek,
      dayName: HEBREW_DAYS[dayOfWeek],
      netProfit: round2(data.net),
      hours: round2(data.hours),
      netPerHour: data.hours > 0 ? round2(data.net / data.hours) : 0,
      segmentCount: data.count
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function buildHeatmapBuckets(segments: SegmentRow[], vehicle: VehicleSettings): Map<string, { net: number; hours: number }> {
  const buckets = new Map<string, { net: number; hours: number }>();

  for (const { segment, dayDate } of segments) {
    const hours = calculateDuration(segment);
    if (hours <= 0) continue;
    const fuel = calculateFuelCost(segment.kilometers, vehicle);
    const net = calculateNetProfit(segment.income, fuel);
    const slices = splitSegmentByHours(segment, dayDate);
    const totalH = slices.reduce((s, sl) => s + sl.hours, 0) || hours;

    for (const slice of slices) {
      const share = slice.hours / totalH;
      const key = String(slice.hour);
      const prev = buckets.get(key) ?? { net: 0, hours: 0 };
      buckets.set(key, { net: prev.net + net * share, hours: prev.hours + slice.hours });
    }
  }

  return buckets;
}

function buildHourBlocks(segments: SegmentRow[], vehicle: VehicleSettings): HourBlockStats[] {
  const buckets = buildHeatmapBuckets(segments, vehicle);
  const blocks: Array<{ start: number; end: number }> = [
    { start: 6, end: 11 },
    { start: 11, end: 17 },
    { start: 17, end: 22 },
    { start: 22, end: 24 },
    { start: 0, end: 6 }
  ];

  return blocks
    .map(({ start, end }) => {
      let net = 0;
      let hours = 0;
      for (let h = start; h < end; h += 1) {
        const data = buckets.get(String(h));
        if (data) {
          net += data.net;
          hours += data.hours;
        }
      }
      const endLabel = end === 24 ? "00" : String(end).padStart(2, "0");
      return {
        startHour: start,
        endHour: end,
        label: `${String(start).padStart(2, "0")}:00–${endLabel}:00`,
        netPerHour: hours > 0 ? round2(net / hours) : 0,
        hours: round2(hours)
      };
    })
    .filter((b) => b.hours >= 0.5);
}

function splitSegmentByHours(
  segment: ShiftSegment,
  dayDate: string
): Array<{ hour: number; hours: number }> {
  const start = toMinutes(segment.startTime);
  const end = toMinutes(segment.endTime);
  if (start === null || end === null) return [];

  const [y, m, d] = dayDate.split("-").map(Number);
  const base = new Date(y, m - 1, d, 0, 0, 0, 0);
  let startMs = base.getTime() + start * 60 * 1000;
  let endMs = base.getTime() + end * 60 * 1000;
  if (segment.endsNextDay || endMs <= startMs) endMs += 24 * 60 * 60 * 1000;

  const slices: Array<{ hour: number; hours: number }> = [];
  let cursor = startMs;
  while (cursor < endMs) {
    const date = new Date(cursor);
    const hour = date.getHours();
    const hourEnd = new Date(date);
    hourEnd.setMinutes(59, 59, 999);
    const sliceEnd = Math.min(endMs, hourEnd.getTime() + 1);
    const hours = (sliceEnd - cursor) / (1000 * 60 * 60);
    if (hours > 0) slices.push({ hour, hours });
    cursor = sliceEnd;
  }
  return slices;
}

export function computeWorkStreak(shiftDays: ShiftDay[]): number {
  const activeDates = [...new Set(shiftDays.filter((d) => d.segments.length > 0).map((d) => d.date))].sort(
    (a, b) => b.localeCompare(a)
  );
  if (activeDates.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i += 1) {
    const key = toDateKey(cursor);
    if (activeDates.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak > 0) {
      break;
    } else {
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  return streak;
}

export function getVehicleExpenseContext(vehicle: VehicleSettings) {
  const monthlyFixed = getMonthlyFixedTotal(vehicle);
  const dailyFixed = getFixedDailyCost(vehicle);
  const labels: Record<VehicleSettings["type"], string> = {
    car: "רכב",
    scooter: "קטנוע",
    electric: "רכב חשמלי"
  };
  return { monthlyFixed, dailyFixed, label: labels[vehicle.type] };
}

function collectSegments(days: ShiftDay[]): SegmentRow[] {
  const out: SegmentRow[] = [];
  for (const day of days) {
    for (const segment of day.segments) {
      out.push({ segment, dayDate: day.date });
    }
  }
  return out;
}

function toMinutes(value: string): number | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
