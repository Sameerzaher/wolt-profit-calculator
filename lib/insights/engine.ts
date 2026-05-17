import { PLATFORM_LABELS } from "@/types/platform";
import type { DeliveryPlatform } from "@/types/platform";
import type { CourierInsight, CourierInsightsReport, WeeklyInsightSummary } from "@/types/insights";
import type { ShiftDay } from "@/types/shift";
import type { VehicleSettings } from "@/types/vehicle";
import { buildInsightContext } from "@/lib/insights/context";
import {
  buildMotivationState,
  generateExpenseInsights,
  generateMotivationInsights,
  generatePlatformInsights,
  generateProfitabilityInsights,
  generateShiftOptimizationInsights,
  generateWorkHabitsInsights
} from "@/lib/insights/generators";
import { percentDelta, pickTopInsight, sortInsights } from "@/lib/insights/scoring";

const MIN_SEGMENTS = 2;

export function buildCourierInsights(shiftDays: ShiftDay[], vehicle: VehicleSettings): CourierInsightsReport {
  const ctx = buildInsightContext(shiftDays, vehicle);
  const segmentCount = ctx.weekSegments.length;
  const hasEnoughData = segmentCount >= MIN_SEGMENTS;

  const raw: CourierInsight[] = hasEnoughData
    ? [
        ...generateProfitabilityInsights(ctx),
        ...generateWorkHabitsInsights(ctx),
        ...generatePlatformInsights(ctx),
        ...generateExpenseInsights(ctx),
        ...generateShiftOptimizationInsights(ctx),
        ...generateMotivationInsights(ctx)
      ]
    : [emptyStateInsight()];

  const deduped = dedupeInsights(raw);
  const insights = sortInsights(deduped.filter((i) => i.tone === "insight"));
  const warnings = sortInsights(deduped.filter((i) => i.tone === "warning"));
  const recommendations = sortInsights(deduped.filter((i) => i.tone === "recommendation" || i.tone === "motivation"));

  const weekly = buildWeeklySummary(ctx);
  const motivation = buildMotivationState(ctx);
  const topInsight = pickTopInsight(deduped);

  return {
    generatedAt: new Date().toISOString(),
    hasEnoughData,
    segmentCount,
    weekly,
    motivation,
    insights,
    warnings,
    recommendations,
    topInsight
  };
}

function buildWeeklySummary(ctx: ReturnType<typeof buildInsightContext>): WeeklyInsightSummary {
  const bestPlatform = pickBestPlatform(ctx.weekByPlatform);
  const vsLastWeekNetPercent = percentDelta(ctx.weekTotals.net, ctx.lastWeekTotals.net);

  let headline = "סיכום השבוע שלך";
  if (ctx.weekTotals.net > 0) {
    headline = `₪${ctx.weekTotals.net.toFixed(0)} נטו · ${ctx.weekTotals.activeDays} ימי עבודה`;
  }
  if (bestPlatform) {
    headline += ` · ${PLATFORM_LABELS[bestPlatform]} מוביל`;
  }

  return {
    startDate: ctx.weekStart,
    endDate: ctx.weekEnd,
    daysWorked: ctx.weekTotals.activeDays,
    totalIncome: ctx.weekTotals.income,
    netProfit: ctx.weekTotals.net,
    netProfitPerHour: ctx.weekTotals.netPerHour,
    totalHours: ctx.weekTotals.hours,
    totalDeliveries: ctx.weekTotals.deliveries,
    fuelCost: ctx.weekTotals.fuel,
    fixedCost: ctx.weekTotals.fixed,
    expenseRatio: ctx.weekTotals.expenseRatio,
    bestPlatform,
    vsLastWeekNetPercent,
    headline
  };
}

function pickBestPlatform(stats: { platform: DeliveryPlatform; netProfitPerHour: number; totalHours: number }[]) {
  const active = stats.filter((p) => p.totalHours > 0);
  if (active.length === 0) return null;
  return active.reduce((a, b) => (b.netProfitPerHour > a.netProfitPerHour ? b : a)).platform;
}

function dedupeInsights(items: CourierInsight[]): CourierInsight[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}-${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function emptyStateInsight(): CourierInsight {
  return {
    id: "empty-state",
    category: "work_habits",
    tone: "recommendation",
    title: "הוסיפו משמרות לתובנות",
    message: "רשמו לפחות 2 מקטעי משמרת השבוע כדי לקבל תובנות עסקיות מותאמות אישית.",
    score: 10
  };
}
