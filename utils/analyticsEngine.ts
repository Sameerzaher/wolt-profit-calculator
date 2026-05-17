import { PLATFORM_LABELS, PLATFORMS, type DeliveryPlatform } from "@/types/platform";
import type {
  AnalyticsInsight,
  AnalyticsPeriod,
  AnalyticsReport,
  AnalyticsTotals,
  DayInsight,
  HeatmapCell,
  HourRangeInsight,
  PlatformComparison,
  PlatformStats,
  TrendPoint
} from "@/types/analytics";
import type { ShiftDay, ShiftSegment } from "@/types/shift";
import type { VehicleSettings } from "@/types/vehicle";
import {
  calculateDailyTotals,
  calculateDuration,
  calculateEstimatedExpenses,
  calculateFuelCost,
  calculateIncomePerHour,
  calculateNetProfit,
  calculatePlatformPerformance
} from "@/utils/calculations";
import { formatHebrewDate, getTodayKey, isDateInRange, startOfMonth, startOfWeek } from "@/utils/dates";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const EVENING_START = 17;
const EVENING_END = 22;
const LATE_NIGHT_HOUR = 23;

type SegmentRow = { segment: ShiftSegment; dayDate: string };

export function getPeriodRange(period: AnalyticsPeriod): { start: string; end: string } {
  const end = getTodayKey();
  if (period === "week") return { start: startOfWeek(), end };
  if (period === "month") return { start: startOfMonth(), end };
  return { start: "1970-01-01", end };
}

export function buildAnalyticsReport(
  shiftDays: ShiftDay[],
  vehicle: VehicleSettings,
  period: AnalyticsPeriod
): AnalyticsReport {
  const { start, end } = getPeriodRange(period);
  const filteredDays = shiftDays.filter(
    (day) => day.segments.length > 0 && isDateInRange(day.date, start, end)
  );
  const segments = collectSegments(filteredDays);
  const byPlatform = calculatePlatformPerformance(filteredDays, vehicle, { start, end });
  const trends = buildTrendSeries(filteredDays, vehicle);
  const heatmap = buildHourlyHeatmap(segments, vehicle);
  const dayInsights = buildDayInsights(filteredDays, vehicle);

  const totals = buildTotals(filteredDays, segments, vehicle, byPlatform);
  const bestDay = pickExtremeDay(dayInsights, "max");
  const worstDay = pickExtremeDay(dayInsights, "min");
  const bestPlatform = pickBestPlatform(byPlatform);
  const worstPlatform = pickWorstPlatform(byPlatform);
  const bestHourRange = findBestHourRange(heatmap);
  const comparison = buildComparison(byPlatform, worstPlatform);
  const insights = generateInsights({
    period,
    byPlatform,
    bestPlatform,
    worstPlatform,
    bestHourRange,
    heatmap,
    segments,
    vehicle,
    totals
  });

  return {
    period,
    startDate: period === "all" && filteredDays.length > 0 ? filteredDays[filteredDays.length - 1].date : start,
    endDate: end,
    daysWorked: filteredDays.length,
    totals,
    trends,
    byPlatform,
    comparison,
    bestDay,
    worstDay,
    bestPlatform,
    worstPlatform,
    bestHourRange,
    heatmap,
    insights
  };
}

function buildTotals(
  days: ShiftDay[],
  segments: SegmentRow[],
  vehicle: VehicleSettings,
  byPlatform: PlatformStats[]
): AnalyticsTotals {
  const totalIncome = round2(byPlatform.reduce((s, r) => s + r.totalIncome, 0));
  const totalHours = round2(byPlatform.reduce((s, r) => s + r.totalHours, 0));
  const totalKilometers = round2(byPlatform.reduce((s, r) => s + r.totalKilometers, 0));
  const totalDeliveries = byPlatform.reduce((s, r) => s + r.totalDeliveries, 0);
  const fuelCost = round2(byPlatform.reduce((s, r) => s + r.fuelCost, 0));
  const fixedCost = round2(byPlatform.reduce((s, r) => s + r.fixedCostShare, 0));
  const totalExpenses = round2(fuelCost + fixedCost);
  const netProfit = calculateNetProfit(totalIncome, totalExpenses);
  const totalShifts = segments.length;

  return {
    totalIncome,
    totalHours,
    totalKilometers,
    totalDeliveries,
    totalShifts,
    fuelCost,
    fixedCost,
    totalExpenses,
    netProfit,
    incomePerHour: calculateIncomePerHour(totalIncome, totalHours),
    netProfitPerHour: calculateIncomePerHour(netProfit, totalHours),
    averageIncomePerShift: totalShifts > 0 ? round2(totalIncome / totalShifts) : 0
  };
}

function buildTrendSeries(days: ShiftDay[], vehicle: VehicleSettings): TrendPoint[] {
  return days
    .map((day) => {
      const summary = calculateDailyTotals(day, vehicle);
      return {
        date: day.date,
        label: formatHebrewDate(day.date),
        income: summary.totalIncome,
        netProfit: summary.netProfit,
        kilometers: summary.totalKilometers,
        netProfitPerHour: summary.netProfitPerHour,
        hours: summary.totalHours
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildDayInsights(days: ShiftDay[], vehicle: VehicleSettings): DayInsight[] {
  return days
    .map((day) => {
      const s = calculateDailyTotals(day, vehicle);
      return {
        date: day.date,
        label: formatHebrewDate(day.date),
        netProfit: s.netProfit,
        income: s.totalIncome,
        netProfitPerHour: s.netProfitPerHour
      };
    })
    .filter((d) => d.income > 0 || d.netProfit !== 0);
}

function buildHourlyHeatmap(segments: SegmentRow[], vehicle: VehicleSettings): HeatmapCell[] {
  const buckets = new Map<string, { net: number; hours: number; count: number }>();

  for (const { segment, dayDate } of segments) {
    const hours = calculateDuration(segment);
    if (hours <= 0) continue;
    const fuel = calculateFuelCost(segment.kilometers, vehicle);
    const net = calculateNetProfit(segment.income, fuel);
    const slices = splitSegmentByHours(segment, dayDate);
    const totalSliceHours = slices.reduce((s, sl) => s + sl.hours, 0) || hours;

    for (const slice of slices) {
      const share = slice.hours / totalSliceHours;
      const key = `${slice.dayOfWeek}-${slice.hour}`;
      const prev = buckets.get(key) ?? { net: 0, hours: 0, count: 0 };
      buckets.set(key, {
        net: prev.net + net * share,
        hours: prev.hours + slice.hours,
        count: prev.count + 1
      });
    }
  }

  const cells: HeatmapCell[] = [];
  let maxRate = 0;

  for (const [key, data] of buckets.entries()) {
    if (data.hours <= 0) continue;
    const [dowStr, hourStr] = key.split("-");
    const dayOfWeek = Number(dowStr);
    const hour = Number(hourStr);
    const netProfitPerHour = data.net / data.hours;
    maxRate = Math.max(maxRate, netProfitPerHour);
    cells.push({
      dayOfWeek,
      dayName: HEBREW_DAYS[dayOfWeek] ?? "",
      hour,
      netProfitPerHour: round2(netProfitPerHour),
      segmentCount: data.count,
      intensity: 0
    });
  }

  return cells.map((cell) => ({
    ...cell,
    intensity: maxRate > 0 ? Math.min(1, Math.max(0, cell.netProfitPerHour / maxRate)) : 0
  }));
}

function splitSegmentByHours(
  segment: ShiftSegment,
  dayDate: string
): Array<{ dayOfWeek: number; hour: number; hours: number }> {
  const start = toMinutes(segment.startTime);
  const end = toMinutes(segment.endTime);
  if (start === null || end === null) return [];

  const [y, m, d] = dayDate.split("-").map(Number);
  const base = new Date(y, m - 1, d, 0, 0, 0, 0);
  let startMs = base.getTime() + start * 60 * 1000;
  let endMs = base.getTime() + end * 60 * 1000;
  if (segment.endsNextDay || endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }

  const slices: Array<{ dayOfWeek: number; hour: number; hours: number }> = [];
  let cursor = startMs;
  while (cursor < endMs) {
    const date = new Date(cursor);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const hourEnd = new Date(date);
    hourEnd.setMinutes(59, 59, 999);
    const sliceEnd = Math.min(endMs, hourEnd.getTime() + 1);
    const hours = (sliceEnd - cursor) / (1000 * 60 * 60);
    if (hours > 0) {
      slices.push({ dayOfWeek, hour, hours });
    }
    cursor = sliceEnd;
  }
  return slices;
}

function findBestHourRange(heatmap: HeatmapCell[]): HourRangeInsight | null {
  const eveningCells = heatmap.filter((c) => c.hour >= EVENING_START && c.hour <= EVENING_END && c.segmentCount > 0);
  if (eveningCells.length === 0) return null;

  const byDay = new Map<number, { net: number; hours: number; count: number }>();
  for (const cell of eveningCells) {
    const prev = byDay.get(cell.dayOfWeek) ?? { net: 0, hours: 0, count: 0 };
    byDay.set(cell.dayOfWeek, {
      net: prev.net + cell.netProfitPerHour * (cell.segmentCount || 1),
      hours: prev.hours + 1,
      count: prev.count + cell.segmentCount
    });
  }

  let bestDow = 0;
  let bestRate = -Infinity;
  for (const [dow, data] of byDay.entries()) {
    const rate = data.net / data.hours;
    if (rate > bestRate) {
      bestRate = rate;
      bestDow = dow;
    }
  }

  if (!Number.isFinite(bestRate)) return null;

  return {
    label: `${HEBREW_DAYS[bestDow]} ${EVENING_START}:00–${EVENING_END + 1}:00`,
    dayOfWeek: bestDow,
    dayName: HEBREW_DAYS[bestDow],
    startHour: EVENING_START,
    endHour: EVENING_END + 1,
    netProfitPerHour: round2(bestRate),
    segmentCount: byDay.get(bestDow)?.count ?? 0
  };
}

function generateInsights(ctx: {
  period: AnalyticsPeriod;
  byPlatform: PlatformStats[];
  bestPlatform: DeliveryPlatform | null;
  worstPlatform: DeliveryPlatform | null;
  bestHourRange: HourRangeInsight | null;
  heatmap: HeatmapCell[];
  segments: SegmentRow[];
  vehicle: VehicleSettings;
  totals: AnalyticsTotals;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const periodLabel = ctx.period === "week" ? "השבוע" : ctx.period === "month" ? "החודש" : "בסך הכל";

  if (ctx.bestPlatform) {
    const row = ctx.byPlatform.find((p) => p.platform === ctx.bestPlatform);
    if (row && row.netProfitPerHour > 0) {
      insights.push({
        id: "best-platform-hourly",
        message: `${PLATFORM_LABELS[ctx.bestPlatform]} נותן לך את ה-₪ לשעה הכי גבוה ${periodLabel} — ₪${row.netProfitPerHour.toFixed(1)} נטו לשעה.`,
        priority: 100
      });
    }
  }

  if (ctx.bestHourRange && ctx.bestHourRange.netProfitPerHour > 0) {
    insights.push({
      id: "best-day-evening",
      message: `ערבי ${ctx.bestHourRange.dayName} הם המשמרות הכי משתלמות שלך — בממוצע ₪${ctx.bestHourRange.netProfitPerHour.toFixed(1)} נטו לשעה.`,
      priority: 90
    });
  }

  for (const platform of PLATFORMS) {
    const late = ctx.segments.filter(
      (r) => r.segment.platform === platform && toMinutes(r.segment.startTime) !== null && getStartHour(r.segment) >= LATE_NIGHT_HOUR
    );
    const early = ctx.segments.filter(
      (r) => r.segment.platform === platform && toMinutes(r.segment.startTime) !== null && getStartHour(r.segment) < LATE_NIGHT_HOUR
    );
    if (late.length < 2 || early.length < 2) continue;

    const lateRate = avgNetPerHour(late, ctx.vehicle);
    const earlyRate = avgNetPerHour(early, ctx.vehicle);
    if (earlyRate > 0 && lateRate < earlyRate * 0.65) {
      insights.push({
        id: `late-${platform}`,
        message: `${PLATFORM_LABELS[platform]} פחות משתלם אחרי ${LATE_NIGHT_HOUR}:00 — ₪${lateRate.toFixed(1)} לעומת ₪${earlyRate.toFixed(1)} נטו לשעה מוקדם יותר.`,
        priority: 70
      });
    }
  }

  if (ctx.worstPlatform && ctx.worstPlatform !== ctx.bestPlatform) {
    const row = ctx.byPlatform.find((p) => p.platform === ctx.worstPlatform);
    if (row) {
      insights.push({
        id: "worst-platform",
        message: `${PLATFORM_LABELS[ctx.worstPlatform]} הכי פחות משתלם ${periodLabel} — ₪${row.netProfitPerHour.toFixed(1)} נטו לשעה.`,
        priority: 50
      });
    }
  }

  if (ctx.totals.averageIncomePerShift > 0) {
    insights.push({
      id: "avg-shift",
      message: `ממוצע הכנסה למקטע: ₪${ctx.totals.averageIncomePerShift.toFixed(0)} · ${ctx.totals.totalDeliveries} משלוחים ${periodLabel}.`,
      priority: 30
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "empty",
      message: "הוסיפו עוד מקטעי משמרת כדי לקבל תובנות מדויקות יותר.",
      priority: 0
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

function avgNetPerHour(rows: SegmentRow[], vehicle: VehicleSettings): number {
  let net = 0;
  let hours = 0;
  for (const { segment } of rows) {
    const h = calculateDuration(segment);
    if (h <= 0) continue;
    const fuel = calculateFuelCost(segment.kilometers, vehicle);
    net += calculateNetProfit(segment.income, fuel);
    hours += h;
  }
  return hours > 0 ? net / hours : 0;
}

function getStartHour(segment: ShiftSegment): number {
  const m = toMinutes(segment.startTime);
  return m !== null ? Math.floor(m / 60) : 0;
}

function buildComparison(byPlatform: PlatformStats[], worst: DeliveryPlatform | null): PlatformComparison {
  const withHours = byPlatform.filter((p) => p.totalHours > 0);
  const withKm = byPlatform.filter((p) => p.totalKilometers > 0);
  const bestNetProfitPerHour =
    withHours.length > 0
      ? withHours.reduce((a, b) => (b.netProfitPerHour > a.netProfitPerHour ? b : a))
      : null;
  const bestIncomePerKm =
    withKm.length > 0 ? withKm.reduce((a, b) => (b.incomePerKm > a.incomePerKm ? b : a)) : null;
  return {
    bestNetProfitPerHour: bestNetProfitPerHour
      ? { platform: bestNetProfitPerHour.platform, value: bestNetProfitPerHour.netProfitPerHour }
      : null,
    bestIncomePerKm: bestIncomePerKm ? { platform: bestIncomePerKm.platform, value: bestIncomePerKm.incomePerKm } : null,
    worstPlatformToday: worst
  };
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

function pickExtremeDay(days: DayInsight[], mode: "max" | "min"): DayInsight | null {
  if (days.length === 0) return null;
  return days.reduce((chosen, current) =>
    mode === "max" ? (current.netProfit > chosen.netProfit ? current : chosen) : current.netProfit < chosen.netProfit ? current : chosen
  );
}

function pickBestPlatform(stats: PlatformStats[]): DeliveryPlatform | null {
  const active = stats.filter((r) => r.totalHours > 0);
  if (active.length === 0) return null;
  return active.reduce((a, b) => (b.netProfitPerHour > a.netProfitPerHour ? b : a)).platform;
}

function pickWorstPlatform(stats: PlatformStats[]): DeliveryPlatform | null {
  const active = stats.filter((r) => r.totalHours > 0);
  if (active.length < 2) return null;
  return active.reduce((a, b) => (b.netProfitPerHour < a.netProfitPerHour ? b : a)).platform;
}

function toMinutes(value: string): number | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
