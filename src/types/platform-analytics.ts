import type { DeliveryPlatform } from "@/src/types/delivery-platform";

export type DateRangePreset = "today" | "week" | "month" | "custom";

export interface DateRangeSelection {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

export interface PlatformDaySnapshot {
  shiftDate: string;
  netProfit: number;
  income: number;
  hours: number;
}

export interface PlatformAnalyticsRow {
  platform: DeliveryPlatform;
  totalShifts: number;
  totalIncome: number;
  totalHours: number;
  totalKilometers: number;
  totalFuelCost: number;
  totalNetProfit: number;
  averageNetPerHour: number;
  averageIncomePerKm: number;
  bestDay: PlatformDaySnapshot | null;
  worstDay: PlatformDaySnapshot | null;
}

export interface PlatformRecommendation {
  platform: DeliveryPlatform | null;
  netProfitPerHour: number;
  title: string;
  message: string;
}

export interface PlatformAnalyticsDashboard {
  range: DateRangeSelection;
  platforms: PlatformAnalyticsRow[];
  recommendation: PlatformRecommendation;
  hasData: boolean;
}
