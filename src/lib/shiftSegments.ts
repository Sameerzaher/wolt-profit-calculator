import { calculateCost, calculateHourlyRate, calculatePerKm, calculateProfit } from "@/lib/calculations";
import { round2 } from "@/lib/utils";
import type {
  DayShiftAnalysis,
  DayShiftRecord,
  DayTotals,
  DeliveryPlatform,
  PlatformComparison,
  PlatformDayStats,
  SegmentMetrics,
  ShiftSegment
} from "@/src/types/delivery-platform";
import { DELIVERY_PLATFORMS } from "@/src/types/delivery-platform";

export function segmentDurationHours(segment: ShiftSegment): number {
  const start = toMinutes(segment.startTime);
  const end = toMinutes(segment.endTime);
  if (start === null || end === null) return 0;
  const nextDay = segment.endsNextDay || end < start;
  const endMinutes = nextDay ? end + 24 * 60 : end;
  const diff = endMinutes - start;
  return diff > 0 ? round2(diff / 60) : 0;
}

export function calculateSegmentMetrics(segment: ShiftSegment, costPerKm: number): SegmentMetrics {
  const durationHours = segmentDurationHours(segment);
  const income = normalize(segment.incomeIls);
  const km = normalize(segment.kilometers);
  const fuelCost = calculateCost(km, costPerKm);
  const netProfit = calculateProfit(income, fuelCost);

  return {
    segmentId: segment.id,
    platform: segment.platform,
    durationHours,
    incomePerHour: calculateHourlyRate(income, durationHours),
    incomePerKm: calculatePerKm(income, km),
    fuelCost,
    netProfit
  };
}

export function calculateDayTotals(segments: ShiftSegment[], costPerKm: number): DayTotals {
  const metrics = segments.map((segment) => calculateSegmentMetrics(segment, costPerKm));
  return {
    totalIncome: round2(segments.reduce((sum, s) => sum + normalize(s.incomeIls), 0)),
    totalHours: round2(metrics.reduce((sum, m) => sum + m.durationHours, 0)),
    totalKilometers: round2(segments.reduce((sum, s) => sum + normalize(s.kilometers), 0)),
    totalFuelCost: round2(metrics.reduce((sum, m) => sum + m.fuelCost, 0)),
    totalNetProfit: round2(metrics.reduce((sum, m) => sum + m.netProfit, 0))
  };
}

export function aggregateByPlatform(segments: ShiftSegment[], costPerKm: number): PlatformDayStats[] {
  const metrics = segments.map((segment) => ({
    segment,
    metrics: calculateSegmentMetrics(segment, costPerKm)
  }));

  return DELIVERY_PLATFORMS.map((platform) => {
    const rows = metrics.filter((row) => row.segment.platform === platform);
    const income = round2(rows.reduce((sum, row) => sum + normalize(row.segment.incomeIls), 0));
    const hours = round2(rows.reduce((sum, row) => sum + row.metrics.durationHours, 0));
    const kilometers = round2(rows.reduce((sum, row) => sum + normalize(row.segment.kilometers), 0));
    const fuelCost = round2(rows.reduce((sum, row) => sum + row.metrics.fuelCost, 0));
    const netProfit = round2(rows.reduce((sum, row) => sum + row.metrics.netProfit, 0));

    return {
      platform,
      segmentCount: rows.length,
      income,
      hours,
      kilometers,
      fuelCost,
      netProfit,
      netProfitPerHour: calculateHourlyRate(netProfit, hours),
      incomePerKm: calculatePerKm(income, kilometers)
    };
  }).filter((row) => row.segmentCount > 0);
}

export function comparePlatforms(stats: PlatformDayStats[]): PlatformComparison {
  const withHours = stats.filter((s) => s.hours > 0);
  const withKm = stats.filter((s) => s.kilometers > 0);

  const bestNetProfitPerHour =
    withHours.length === 0
      ? null
      : withHours.reduce((best, current) =>
          current.netProfitPerHour > best.netProfitPerHour ? current : best
        );

  const bestIncomePerKm =
    withKm.length === 0
      ? null
      : withKm.reduce((best, current) => (current.incomePerKm > best.incomePerKm ? current : best));

  const worstPlatformToday =
    withHours.length < 2
      ? null
      : withHours.reduce((worst, current) =>
          current.netProfitPerHour < worst.netProfitPerHour ? current : worst
        ).platform;

  return {
    bestNetProfitPerHour: bestNetProfitPerHour
      ? { platform: bestNetProfitPerHour.platform, value: bestNetProfitPerHour.netProfitPerHour }
      : null,
    bestIncomePerKm: bestIncomePerKm ? { platform: bestIncomePerKm.platform, value: bestIncomePerKm.incomePerKm } : null,
    worstPlatformToday
  };
}

export function analyzeDayShift(record: DayShiftRecord): DayShiftAnalysis {
  const segments = record.segments.map((segment) => calculateSegmentMetrics(segment, record.costPerKm));
  const byPlatform = aggregateByPlatform(record.segments, record.costPerKm);
  return {
    segments,
    totals: calculateDayTotals(record.segments, record.costPerKm),
    byPlatform,
    comparison: comparePlatforms(byPlatform)
  };
}

export function createEmptySegment(platform: DeliveryPlatform = "wolt"): ShiftSegment {
  return {
    id: crypto.randomUUID(),
    platform,
    startTime: "09:00",
    endTime: "12:00",
    endsNextDay: false,
    incomeIls: 0,
    kilometers: 0,
    notes: ""
  };
}

export function createEmptyDayRecord(shiftDate: string, costPerKm: number): DayShiftRecord {
  const now = new Date().toISOString();
  return {
    shiftDate,
    segments: [],
    costPerKm,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1
  };
}

export function validateShiftSegments(segments: ShiftSegment[]): string[] {
  const issues: string[] = [];
  const ranges = segments
    .map((segment) => {
      const start = toMinutes(segment.startTime);
      const end = toMinutes(segment.endTime);
      if (start === null || end === null) return null;
      const nextDay = segment.endsNextDay || end < start;
      return { id: segment.id, start, end: nextDay ? end + 24 * 60 : end };
    })
    .filter((value): value is { id: string; start: number; end: number } => value !== null)
    .sort((a, b) => a.start - b.start);

  for (const segment of segments) {
    const start = toMinutes(segment.startTime);
    const end = toMinutes(segment.endTime);
    if (start !== null && end !== null && start === end && !segment.endsNextDay) {
      issues.push("שעת סיום לא יכולה להיות זהה לשעת התחלה");
      break;
    }
    if (segment.incomeIls < 0 || segment.kilometers < 0) {
      issues.push("הכנסה וק״מ חייבים להיות ערכים חיוביים");
      break;
    }
  }

  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      issues.push("מקטעים חופפים בזמן — בדקו שעות התחלה וסיום");
      break;
    }
  }

  return [...new Set(issues)];
}

function normalize(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function toMinutes(value: string): number | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
