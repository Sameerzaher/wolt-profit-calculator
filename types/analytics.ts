import type { DeliveryPlatform } from "@/types/platform";

/** Compact daily rollup for summary cards */
export interface DayTotals {
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalFuelCost: number;
  totalNetProfit: number;
}

export interface PlatformStats {
  platform: DeliveryPlatform;
  shiftCount: number;
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalDeliveries: number;
  fuelCost: number;
  fixedCostShare: number;
  totalExpenses: number;
  netProfit: number;
  incomePerHour: number;
  incomePerKm: number;
  netProfitPerHour: number;
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalDeliveries: number;
  fuelCost: number;
  fixedDailyCost: number;
  totalExpenses: number;
  netProfit: number;
  incomePerHour: number;
  netProfitPerHour: number;
  incomePerKm: number;
  byPlatform: PlatformStats[];
  bestPlatform: DeliveryPlatform | null;
  recommendation: string;
}

export interface PlatformComparison {
  bestNetProfitPerHour: { platform: DeliveryPlatform; value: number } | null;
  bestIncomePerKm: { platform: DeliveryPlatform; value: number } | null;
  worstPlatformToday: DeliveryPlatform | null;
}

export type PlatformDayStats = PlatformStats;

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  daysWorked: number;
  totals: Omit<DailySummary, "date" | "byPlatform" | "bestPlatform" | "recommendation">;
  byPlatform: PlatformStats[];
  bestPlatform: DeliveryPlatform | null;
  recommendation: string;
  dailySeries: Array<{ date: string; netProfit: number; income: number }>;
}

export type AnalyticsPeriod = "week" | "month" | "all";

export interface TrendPoint {
  date: string;
  label: string;
  income: number;
  netProfit: number;
  kilometers: number;
  netProfitPerHour: number;
  hours: number;
}

export interface DayInsight {
  date: string;
  label: string;
  netProfit: number;
  income: number;
  netProfitPerHour: number;
}

export interface HourRangeInsight {
  label: string;
  dayOfWeek: number;
  dayName: string;
  startHour: number;
  endHour: number;
  netProfitPerHour: number;
  segmentCount: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  netProfitPerHour: number;
  segmentCount: number;
  intensity: number;
}

export interface AnalyticsInsight {
  id: string;
  message: string;
  priority: number;
}

export interface AnalyticsTotals {
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalDeliveries: number;
  totalShifts: number;
  fuelCost: number;
  fixedCost: number;
  totalExpenses: number;
  netProfit: number;
  incomePerHour: number;
  netProfitPerHour: number;
  averageIncomePerShift: number;
}

export interface AnalyticsReport {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  daysWorked: number;
  totals: AnalyticsTotals;
  trends: TrendPoint[];
  byPlatform: PlatformStats[];
  comparison: PlatformComparison;
  bestDay: DayInsight | null;
  worstDay: DayInsight | null;
  bestPlatform: DeliveryPlatform | null;
  worstPlatform: DeliveryPlatform | null;
  bestHourRange: HourRangeInsight | null;
  heatmap: HeatmapCell[];
  insights: AnalyticsInsight[];
}
