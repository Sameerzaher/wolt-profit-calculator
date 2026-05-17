import type { DeliveryPlatform } from "@/types/platform";

export type InsightCategory =
  | "profitability"
  | "work_habits"
  | "platform_comparison"
  | "expense_optimization"
  | "shift_optimization";

export type InsightTone = "insight" | "recommendation" | "warning" | "motivation";

export interface CourierInsight {
  id: string;
  category: InsightCategory;
  tone: InsightTone;
  title: string;
  message: string;
  /** 0–100, used for sorting and display */
  score: number;
  /** Optional metric highlight */
  metric?: string;
  platform?: DeliveryPlatform;
}

export interface MotivationState {
  headline: string;
  subline: string;
  emoji: string;
  streakDays: number;
  weeklyNetProfit: number;
  weeklyHours: number;
  level: "starter" | "growing" | "pro" | "elite";
}

export interface WeeklyInsightSummary {
  startDate: string;
  endDate: string;
  daysWorked: number;
  totalIncome: number;
  netProfit: number;
  netProfitPerHour: number;
  totalHours: number;
  totalDeliveries: number;
  fuelCost: number;
  fixedCost: number;
  expenseRatio: number;
  bestPlatform: DeliveryPlatform | null;
  vsLastWeekNetPercent: number | null;
  headline: string;
}

export interface CourierInsightsReport {
  generatedAt: string;
  hasEnoughData: boolean;
  segmentCount: number;
  weekly: WeeklyInsightSummary;
  motivation: MotivationState;
  insights: CourierInsight[];
  warnings: CourierInsight[];
  recommendations: CourierInsight[];
  topInsight: CourierInsight | null;
}
