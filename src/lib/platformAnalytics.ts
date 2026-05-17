import { calculateHourlyRate, calculatePerKm } from "@/lib/calculations";
import { getTodayDateInput } from "@/src/lib/dateTime";
import { calculateSegmentMetrics } from "@/src/lib/shiftSegments";
import type { DayShiftRecord, DeliveryPlatform } from "@/src/types/delivery-platform";
import { DELIVERY_PLATFORMS, PLATFORM_LABELS } from "@/src/types/delivery-platform";
import type {
  DateRangePreset,
  DateRangeSelection,
  PlatformAnalyticsDashboard,
  PlatformAnalyticsRow,
  PlatformDaySnapshot,
  PlatformRecommendation
} from "@/src/types/platform-analytics";
import { round2 } from "@/lib/utils";

export function resolveDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRangeSelection {
  const today = getTodayDateInput();

  if (preset === "today") {
    return { preset, startDate: today, endDate: today };
  }

  if (preset === "week") {
    const start = startOfWeek(new Date());
    return { preset, startDate: toDateKey(start), endDate: today };
  }

  if (preset === "month") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { preset, startDate: toDateKey(start), endDate: today };
  }

  const startDate = customStart && customStart <= today ? customStart : today;
  const endDate = customEnd && customEnd >= startDate ? customEnd : startDate;
  return { preset: "custom", startDate, endDate };
}

export function isDateInRange(shiftDate: string, range: DateRangeSelection): boolean {
  return shiftDate >= range.startDate && shiftDate <= range.endDate;
}

export function buildPlatformAnalyticsDashboard(
  dayShifts: DayShiftRecord[],
  range: DateRangeSelection
): PlatformAnalyticsDashboard {
  const filtered = dayShifts.filter((record) => isDateInRange(record.shiftDate, range));
  const platforms = DELIVERY_PLATFORMS.map((platform) => aggregatePlatform(platform, filtered));
  const recommendation = buildRecommendation(platforms, range);
  const hasData = platforms.some((row) => row.totalShifts > 0);

  return { range, platforms, recommendation, hasData };
}

function aggregatePlatform(platform: DeliveryPlatform, records: DayShiftRecord[]): PlatformAnalyticsRow {
  const dailyMap = new Map<string, PlatformDaySnapshot>();

  let totalShifts = 0;
  let totalIncome = 0;
  let totalHours = 0;
  let totalKilometers = 0;
  let totalFuelCost = 0;
  let totalNetProfit = 0;

  for (const record of records) {
    for (const segment of record.segments) {
      if (segment.platform !== platform) continue;

      const metrics = calculateSegmentMetrics(segment, record.costPerKm);
      totalShifts += 1;
      totalIncome += segment.incomeIls;
      totalHours += metrics.durationHours;
      totalKilometers += segment.kilometers;
      totalFuelCost += metrics.fuelCost;
      totalNetProfit += metrics.netProfit;

      const day = dailyMap.get(record.shiftDate) ?? {
        shiftDate: record.shiftDate,
        netProfit: 0,
        income: 0,
        hours: 0
      };
      day.netProfit = round2(day.netProfit + metrics.netProfit);
      day.income = round2(day.income + segment.incomeIls);
      day.hours = round2(day.hours + metrics.durationHours);
      dailyMap.set(record.shiftDate, day);
    }
  }

  const days = [...dailyMap.values()].filter((day) => day.hours > 0 || day.income > 0);
  const bestDay = pickExtremeDay(days, "max");
  const worstDay = pickExtremeDay(days, "min");

  return {
    platform,
    totalShifts,
    totalIncome: round2(totalIncome),
    totalHours: round2(totalHours),
    totalKilometers: round2(totalKilometers),
    totalFuelCost: round2(totalFuelCost),
    totalNetProfit: round2(totalNetProfit),
    averageNetPerHour: calculateHourlyRate(totalNetProfit, totalHours),
    averageIncomePerKm: calculatePerKm(totalIncome, totalKilometers),
    bestDay,
    worstDay
  };
}

function pickExtremeDay(days: PlatformDaySnapshot[], mode: "max" | "min"): PlatformDaySnapshot | null {
  if (days.length === 0) return null;
  return days.reduce((chosen, current) =>
    mode === "max"
      ? current.netProfit > chosen.netProfit
        ? current
        : chosen
      : current.netProfit < chosen.netProfit
        ? current
        : chosen
  );
}

function buildRecommendation(rows: PlatformAnalyticsRow[], range: DateRangeSelection): PlatformRecommendation {
  const title = "באיזו אפליקציה הכי משתלם לך לעבוד השבוע?";
  const periodLabel = periodLabelForPreset(range.preset);

  const active = rows.filter((row) => row.totalHours > 0);
  if (active.length === 0) {
    return {
      platform: null,
      netProfitPerHour: 0,
      title,
      message: `אין עדיין נתונים ל${periodLabel}. הוסיפו מקטעים במסך המשמרת היומית.`
    };
  }

  const ranked = [...active].sort((a, b) => b.averageNetPerHour - a.averageNetPerHour);
  const best = ranked[0];
  const second = ranked[1];

  if (!second || best.averageNetPerHour - second.averageNetPerHour >= 5) {
    return {
      platform: best.platform,
      netProfitPerHour: best.averageNetPerHour,
      title,
      message: `${periodLabel} הכי משתלם לך לעבוד ב-${PLATFORM_LABELS[best.platform]} — בממוצע ₪${best.averageNetPerHour.toFixed(1)} נטו לשעה.`
    };
  }

  return {
    platform: best.platform,
    netProfitPerHour: best.averageNetPerHour,
    title,
    message: `${periodLabel} ${PLATFORM_LABELS[best.platform]} מובילה ב-₪${best.averageNetPerHour.toFixed(1)} נטו לשעה, אבל ${PLATFORM_LABELS[second.platform]} קרובה (₪${second.averageNetPerHour.toFixed(1)}). שווה לגוון לפי אזור ושעות.`
  };
}

function periodLabelForPreset(preset: DateRangePreset): string {
  switch (preset) {
    case "today":
      return "היום";
    case "week":
      return "השבוע";
    case "month":
      return "החודש";
    default:
      return "התקופה שבחרת";
  }
}

export function formatShiftDateLabel(shiftDate: string): string {
  const [year, month, day] = shiftDate.split("-").map(Number);
  if (!year || !month || !day) return shiftDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" });
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
