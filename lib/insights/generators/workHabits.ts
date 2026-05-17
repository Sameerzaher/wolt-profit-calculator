import type { CourierInsight } from "@/types/insights";
import { computeWorkStreak, type InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore } from "@/lib/insights/scoring";

export function generateWorkHabitsInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const streak = computeWorkStreak(ctx.shiftDays);
  const { weekTotals, weekDays } = ctx;

  if (streak >= 3) {
    insights.push({
      id: "habits-streak",
      category: "work_habits",
      tone: "motivation",
      title: `רצף של ${streak} ימים`,
      message: `עבדת ${streak} ימים ברצף — עקביות כזו בדרך כלל מעלה את הרווח לשעה.`,
      score: finalizeInsightScore(70 + Math.min(20, streak * 3), streak, 3),
      metric: `${streak} ימים`
    });
  }

  const avgHoursPerDay = weekDays.length > 0 ? weekTotals.hours / weekDays.length : 0;
  if (avgHoursPerDay > 8) {
    insights.push({
      id: "habits-long-days",
      category: "work_habits",
      tone: "warning",
      title: "ימי עבודה ארוכים",
      message: `בממוצע ${avgHoursPerDay.toFixed(1)} שעות ליום השבוע — ודא שהנטו לשעה נשאר גבוה ולא רק שעות.`,
      score: finalizeInsightScore(68, weekDays.length),
      metric: `${avgHoursPerDay.toFixed(1)} ש׳/יום`
    });
  } else if (avgHoursPerDay > 0 && avgHoursPerDay < 3 && weekDays.length >= 2) {
    insights.push({
      id: "habits-short-days",
      category: "work_habits",
      tone: "recommendation",
      title: "משמרות קצרות",
      message: `ממוצע ${avgHoursPerDay.toFixed(1)} שעות ליום — נסה להאריך לטווחי שעות חזקים כדי לשפר רווח לשעה.`,
      score: finalizeInsightScore(55, weekDays.length),
      metric: `${avgHoursPerDay.toFixed(1)} ש׳/יום`
    });
  }

  const weekendDays = ctx.dayOfWeekStats.filter((d) => d.dayOfWeek === 5 || d.dayOfWeek === 6);
  const weekdayDays = ctx.dayOfWeekStats.filter((d) => d.dayOfWeek >= 0 && d.dayOfWeek <= 4);
  if (weekendDays.length > 0 && weekdayDays.length > 0) {
    const weekendRate = avgRate(weekendDays);
    const weekdayRate = avgRate(weekdayDays);
    if (weekendRate > weekdayRate * 1.12) {
      insights.push({
        id: "habits-weekend",
        category: "work_habits",
        tone: "insight",
        title: "סופי שבוע חזקים",
        message: `בסופי שבוע אתה מרוויח יותר לשעה (₪${weekendRate.toFixed(1)}) מאשר באמצע השבוע (₪${weekdayRate.toFixed(1)}).`,
        score: finalizeInsightScore(78, weekendDays.reduce((s, d) => s + d.segmentCount, 0)),
        metric: `₪${weekendRate.toFixed(1)}/שעה`
      });
    }
  }

  return insights;
}

function avgRate(days: { netPerHour: number; hours: number }[]): number {
  let net = 0;
  let h = 0;
  for (const d of days) {
    net += d.netPerHour * d.hours;
    h += d.hours;
  }
  return h > 0 ? net / h : 0;
}
