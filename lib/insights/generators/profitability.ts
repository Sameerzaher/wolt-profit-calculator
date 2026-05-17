import type { CourierInsight } from "@/types/insights";
import type { InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore, percentDelta } from "@/lib/insights/scoring";

export function generateProfitabilityInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const { weekTotals, lastWeekTotals, dayOfWeekStats } = ctx;

  if (weekTotals.netPerHour > 0) {
    const vsLast = percentDelta(weekTotals.net, lastWeekTotals.net);
    if (vsLast !== null && Math.abs(vsLast) >= 8) {
      insights.push({
        id: "profit-week-trend",
        category: "profitability",
        tone: vsLast > 0 ? "motivation" : "warning",
        title: vsLast > 0 ? "מגמת רווח עולה" : "ירידה ברווח השבוע",
        message:
          vsLast > 0
            ? `הרווח הנטו שלך עלה ב-${vsLast}% לעומת השבוע שעבר — ₪${weekTotals.net.toFixed(0)} השבוע.`
            : `הרווח הנטו ירד ב-${Math.abs(vsLast)}% לעומת השבוע שעבר. שווה לבדוק שעות ופלטפורמות.`,
        score: finalizeInsightScore(vsLast > 0 ? 88 : 75, ctx.weekDays.length),
        metric: `${vsLast > 0 ? "+" : ""}${vsLast}%`
      });
    }
  }

  if (dayOfWeekStats.length >= 2 && weekTotals.netPerHour > 0) {
    const overallRate = weekTotals.netPerHour;
    let best = dayOfWeekStats[0];
    for (const day of dayOfWeekStats) {
      if (day.netPerHour > best.netPerHour && day.hours >= 1) best = day;
    }
    if (best.hours >= 1 && best.netPerHour > overallRate * 1.08) {
      const pct = Math.round(((best.netPerHour - overallRate) / overallRate) * 100);
      insights.push({
        id: `profit-dow-${best.dayOfWeek}`,
        category: "profitability",
        tone: "insight",
        title: `${best.dayName} משתלם לך יותר`,
        message: `אתה מרוויח בערך ${pct}% יותר בימי ${best.dayName} — בממוצע ₪${best.netPerHour.toFixed(1)} נטו לשעה.`,
        score: finalizeInsightScore(85, best.segmentCount),
        metric: `+${pct}%`
      });
    }
  }

  if (weekTotals.income > 0 && weekTotals.expenseRatio > 35) {
    insights.push({
      id: "profit-low-margin",
      category: "profitability",
      tone: "warning",
      title: "שולי רווח נמוכים",
      message: `ההוצאות אוכלות ${weekTotals.expenseRatio.toFixed(0)}% מההכנסה השבועית. מיקוד בפלטפורמה ושעות חזקות יכול לשפר את הנטו.`,
      score: finalizeInsightScore(72, ctx.weekSegments.length),
      metric: `${weekTotals.expenseRatio.toFixed(0)}%`
    });
  }

  return insights;
}
