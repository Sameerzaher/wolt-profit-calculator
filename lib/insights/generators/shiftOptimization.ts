import type { CourierInsight } from "@/types/insights";
import type { InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore } from "@/lib/insights/scoring";

export function generateShiftOptimizationInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const { hourBlocks, weekTotals } = ctx;

  if (hourBlocks.length === 0) return insights;

  const ranked = [...hourBlocks].filter((b) => b.hours >= 1).sort((a, b) => b.netPerHour - a.netPerHour);
  if (ranked.length === 0) return insights;

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  if (best.netPerHour > 0 && weekTotals.netPerHour > 0) {
    insights.push({
      id: `shift-best-hours-${best.startHour}`,
      category: "shift_optimization",
      tone: "recommendation",
      title: "השעות הכי משתלמות שלך",
      message: `טווח ${best.label} הוא הרווחי ביותר — בממוצע ₪${best.netPerHour.toFixed(1)} נטו לשעה.`,
      score: finalizeInsightScore(90, Math.ceil(best.hours)),
      metric: best.label
    });
  }

  if (ranked.length >= 2 && worst.netPerHour < best.netPerHour * 0.6 && worst.hours >= 1) {
    insights.push({
      id: `shift-avoid-${worst.startHour}`,
      category: "shift_optimization",
      tone: "warning",
      title: "שעות פחות משתלמות",
      message: `בטווח ${worst.label} הרווח לשעה נמוך (₪${worst.netPerHour.toFixed(1)}) — העדף ${best.label}.`,
      score: finalizeInsightScore(72, Math.ceil(worst.hours)),
      metric: worst.label
    });
  }

  const evening = hourBlocks.find((b) => b.startHour === 17);
  if (evening && evening.netPerHour >= weekTotals.netPerHour * 1.1 && evening.hours >= 2) {
    insights.push({
      id: "shift-evening-prime",
      category: "shift_optimization",
      tone: "insight",
      title: "ערב = זמן זהב",
      message: `בין 19:00–22:00 אתה מרוויח בממוצע ₪${evening.netPerHour.toFixed(1)} נטו לשעה — שקול להרחיב משמרות ערב.`,
      score: finalizeInsightScore(88, Math.ceil(evening.hours)),
      metric: "19:00–22:00"
    });
  }

  return insights;
}
