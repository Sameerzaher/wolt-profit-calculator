import { PLATFORM_LABELS, PLATFORMS, type DeliveryPlatform } from "@/types/platform";
import type { DailySummary, PlatformStats, WeeklySummary } from "@/types/analytics";
import type { ShiftDay, ShiftSegment } from "@/types/shift";
import type { VehicleSettings } from "@/types/vehicle";
import { getTodayKey, isDateInRange, startOfWeek } from "@/utils/dates";

const DAYS_IN_MONTH = 30;

function normalize(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateDuration(segment: ShiftSegment): number {
  const start = toMinutes(segment.startTime);
  const end = toMinutes(segment.endTime);
  if (start === null || end === null) return 0;
  const nextDay = segment.endsNextDay || end < start;
  const endMinutes = nextDay ? end + 24 * 60 : end;
  const diff = endMinutes - start;
  return diff > 0 ? round2(diff / 60) : 0;
}

export function calculateIncomePerHour(income: number, hours: number): number {
  if (hours <= 0) return 0;
  return round2(normalize(income) / hours);
}

export function calculateIncomePerKm(income: number, km: number): number {
  if (km <= 0) return 0;
  return round2(normalize(income) / km);
}

export function getMonthlyFixedTotal(vehicle: VehicleSettings): number {
  return normalize(vehicle.monthlyInsurance) + normalize(vehicle.monthlyMaintenance) + normalize(vehicle.monthlyVehicleCost);
}

export function getFixedDailyCost(vehicle: VehicleSettings): number {
  return round2(getMonthlyFixedTotal(vehicle) / DAYS_IN_MONTH);
}

export function calculateFuelCost(km: number, vehicle: VehicleSettings): number {
  return round2(normalize(km) * normalize(vehicle.fuelCostPerKm));
}

export function calculateEstimatedExpenses(
  km: number,
  vehicle: VehicleSettings,
  options?: { includeFixedDaily?: boolean }
): number {
  const fuel = calculateFuelCost(km, vehicle);
  const fixed = options?.includeFixedDaily !== false ? getFixedDailyCost(vehicle) : 0;
  return round2(fuel + fixed);
}

export function calculateNetProfit(income: number, expenses: number): number {
  return round2(normalize(income) - normalize(expenses));
}

export function calculateSegmentExpenses(segment: ShiftSegment, vehicle: VehicleSettings, fixedShare: number): number {
  const fuel = calculateFuelCost(segment.kilometers, vehicle);
  return round2(fuel + fixedShare);
}

function aggregateSegments(
  segments: Array<{ segment: ShiftSegment; dayDate: string }>,
  vehicle: VehicleSettings,
  fixedDailyCost: number
): PlatformStats[] {
  const activeDays = new Set(segments.map((s) => s.dayDate));
  const dayCount = Math.max(1, activeDays.size);
  const fixedPerPlatformDay = fixedDailyCost / dayCount;

  return PLATFORMS.map((platform) => {
    const rows = segments.filter((row) => row.segment.platform === platform);
    const shiftCount = rows.length;
    const totalIncome = round2(rows.reduce((sum, row) => sum + normalize(row.segment.income), 0));
    const totalHours = round2(rows.reduce((sum, row) => sum + calculateDuration(row.segment), 0));
    const totalKilometers = round2(rows.reduce((sum, row) => sum + normalize(row.segment.kilometers), 0));
    const totalDeliveries = rows.reduce((sum, row) => sum + Math.max(0, row.segment.deliveriesCount), 0);
    const fuelCost = round2(rows.reduce((sum, row) => sum + calculateFuelCost(row.segment.kilometers, vehicle), 0));
    const fixedCostShare = round2(fixedPerPlatformDay * new Set(rows.map((r) => r.dayDate)).size);
    const totalExpenses = round2(fuelCost + fixedCostShare);
    const netProfit = calculateNetProfit(totalIncome, totalExpenses);

    return {
      platform,
      shiftCount,
      totalIncome,
      totalHours,
      totalKilometers,
      totalDeliveries,
      fuelCost,
      fixedCostShare,
      totalExpenses,
      netProfit,
      incomePerHour: calculateIncomePerHour(totalIncome, totalHours),
      incomePerKm: calculateIncomePerKm(totalIncome, totalKilometers),
      netProfitPerHour: calculateIncomePerHour(netProfit, totalHours)
    };
  });
}

export function calculatePlatformPerformance(
  shiftDays: ShiftDay[],
  vehicle: VehicleSettings,
  dateFilter?: { start: string; end: string }
): PlatformStats[] {
  const segments = collectSegments(shiftDays, dateFilter);
  const fixedDaily = getFixedDailyCost(vehicle);
  const stats = aggregateSegments(segments, vehicle, fixedDaily);
  return stats.filter((row) => row.shiftCount > 0);
}

export function calculateDailyTotals(shiftDay: ShiftDay, vehicle: VehicleSettings): DailySummary {
  const segments = shiftDay.segments.map((segment) => ({ segment, dayDate: shiftDay.date }));
  const fixedDailyCost = getFixedDailyCost(vehicle);
  const byPlatform = aggregateSegments(segments, vehicle, fixedDailyCost).filter((row) => row.shiftCount > 0);

  const totalIncome = round2(byPlatform.reduce((sum, row) => sum + row.totalIncome, 0));
  const totalHours = round2(byPlatform.reduce((sum, row) => sum + row.totalHours, 0));
  const totalKilometers = round2(byPlatform.reduce((sum, row) => sum + row.totalKilometers, 0));
  const totalDeliveries = byPlatform.reduce((sum, row) => sum + row.totalDeliveries, 0);
  const fuelCost = round2(byPlatform.reduce((sum, row) => sum + row.fuelCost, 0));
  const totalExpenses = shiftDay.segments.length > 0 ? calculateEstimatedExpenses(totalKilometers, vehicle) : 0;
  const netProfit = calculateNetProfit(totalIncome, totalExpenses);

  const bestPlatform = pickBestPlatform(byPlatform);
  const recommendation = buildRecommendation(byPlatform, bestPlatform, "today");

  return {
    date: shiftDay.date,
    totalIncome,
    totalHours,
    totalKilometers,
    totalDeliveries,
    fuelCost,
    fixedDailyCost,
    totalExpenses,
    netProfit,
    incomePerHour: calculateIncomePerHour(totalIncome, totalHours),
    netProfitPerHour: calculateIncomePerHour(netProfit, totalHours),
    incomePerKm: calculateIncomePerKm(totalIncome, totalKilometers),
    byPlatform,
    bestPlatform,
    recommendation
  };
}

export function calculateWeeklyTotals(shiftDays: ShiftDay[], vehicle: VehicleSettings): WeeklySummary {
  const today = getTodayKey();
  const startDate = startOfWeek();
  const endDate = today;
  const weekDays = shiftDays.filter((day) => isDateInRange(day.date, startDate, endDate));
  const byPlatform = calculatePlatformPerformance(weekDays, vehicle);

  const totalIncome = round2(byPlatform.reduce((sum, row) => sum + row.totalIncome, 0));
  const totalHours = round2(byPlatform.reduce((sum, row) => sum + row.totalHours, 0));
  const totalKilometers = round2(byPlatform.reduce((sum, row) => sum + row.totalKilometers, 0));
  const totalDeliveries = byPlatform.reduce((sum, row) => sum + row.totalDeliveries, 0);
  const fuelCost = round2(byPlatform.reduce((sum, row) => sum + row.fuelCost, 0));
  const fixedDailyCost = round2(getFixedDailyCost(vehicle) * weekDays.filter((d) => d.segments.length > 0).length);
  const totalExpenses = round2(fuelCost + fixedDailyCost);
  const netProfit = calculateNetProfit(totalIncome, totalExpenses);

  const bestPlatform = pickBestPlatform(byPlatform);
  const recommendation = buildRecommendation(byPlatform, bestPlatform, "week");

  const dailySeries = weekDays
    .map((day) => {
      const summary = calculateDailyTotals(day, vehicle);
      return { date: day.date, netProfit: summary.netProfit, income: summary.totalIncome };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    startDate,
    endDate,
    daysWorked: weekDays.filter((d) => d.segments.length > 0).length,
    totals: {
      totalIncome,
      totalHours,
      totalKilometers,
      totalDeliveries,
      fuelCost,
      fixedDailyCost,
      totalExpenses,
      netProfit,
      incomePerHour: calculateIncomePerHour(totalIncome, totalHours),
      netProfitPerHour: calculateIncomePerHour(netProfit, totalHours),
      incomePerKm: calculateIncomePerKm(totalIncome, totalKilometers)
    },
    byPlatform,
    bestPlatform,
    recommendation,
    dailySeries
  };
}

function collectSegments(
  shiftDays: ShiftDay[],
  dateFilter?: { start: string; end: string }
): Array<{ segment: ShiftSegment; dayDate: string }> {
  const output: Array<{ segment: ShiftSegment; dayDate: string }> = [];
  for (const day of shiftDays) {
    if (dateFilter && !isDateInRange(day.date, dateFilter.start, dateFilter.end)) continue;
    for (const segment of day.segments) {
      output.push({ segment, dayDate: day.date });
    }
  }
  return output;
}

function pickBestPlatform(stats: PlatformStats[]): DeliveryPlatform | null {
  const active = stats.filter((row) => row.totalHours > 0);
  if (active.length === 0) return null;
  return active.reduce((best, row) => (row.netProfitPerHour > best.netProfitPerHour ? row : best)).platform;
}

function buildRecommendation(
  stats: PlatformStats[],
  best: DeliveryPlatform | null,
  period: "today" | "week"
): string {
  const label = period === "today" ? "היום" : "השבוע";
  if (!best) {
    return `אין עדיין נתונים ל${label}. הוסיפו מקטע משמרת כדי לראות המלצה.`;
  }
  const row = stats.find((s) => s.platform === best);
  if (!row) return `המשיכו לעקוב אחרי המשמרות ב${label}.`;
  return `${label} הכי משתלם לעבוד ב-${PLATFORM_LABELS[best]} — ₪${row.netProfitPerHour.toFixed(1)} נטו לשעה.`;
}

function toMinutes(value: string): number | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function createEmptySegment(platform: DeliveryPlatform = "wolt"): ShiftSegment {
  return {
    id: crypto.randomUUID(),
    platform,
    startTime: "09:00",
    endTime: "12:00",
    endsNextDay: false,
    income: 0,
    kilometers: 0,
    deliveriesCount: 1,
    notes: "",
    weather: "clear",
    rushHour: false
  };
}

export function createShiftDay(date: string): ShiftDay {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date,
    segments: [],
    createdAt: now,
    updatedAt: now
  };
}
