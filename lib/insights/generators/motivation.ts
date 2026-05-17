import { PLATFORM_LABELS } from "@/types/platform";
import type { CourierInsight, MotivationState } from "@/types/insights";
import { computeWorkStreak, type InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore, percentDelta } from "@/lib/insights/scoring";

export function generateMotivationInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const streak = computeWorkStreak(ctx.shiftDays);
  const vsLast = percentDelta(ctx.weekTotals.net, ctx.lastWeekTotals.net);

  if (ctx.weekTotals.net >= 500) {
    insights.push({
      id: "motivation-net-milestone",
      category: "profitability",
      tone: "motivation",
      title: "שבוע חזק",
      message: `₪${ctx.weekTotals.net.toFixed(0)} נטו השבוע — עבודה מצוינת!`,
      score: finalizeInsightScore(85, ctx.weekDays.length),
      metric: `₪${ctx.weekTotals.net.toFixed(0)}`
    });
  }

  if (vsLast !== null && vsLast >= 15) {
    insights.push({
      id: "motivation-improvement",
      category: "profitability",
      tone: "motivation",
      title: "שיפור משמעותי",
      message: `הרווח עלה ב-${vsLast}% מהשבוע שעבר — המשך באותו כיוון!`,
      score: finalizeInsightScore(80, ctx.weekDays.length),
      metric: `+${vsLast}%`
    });
  }

  if (streak >= 5) {
    insights.push({
      id: "motivation-streak-hero",
      category: "work_habits",
      tone: "motivation",
      title: "שליח/ה בלי הפסקה",
      message: `${streak} ימים ברצף — אתה בנבדל העליון של העקביות.`,
      score: finalizeInsightScore(75, streak, 5),
      metric: `${streak}🔥`
    });
  }

  const best = ctx.weekByPlatform.filter((p) => p.totalHours > 0).sort((a, b) => b.netProfitPerHour - a.netProfitPerHour)[0];
  if (best && ctx.weekSegments.length < 3) {
    insights.push({
      id: "motivation-get-started",
      category: "work_habits",
      tone: "motivation",
      title: "התחלה טובה",
      message: `הוסף עוד משמרות כדי לפתוח תובנות מדויקות יותר. ${PLATFORM_LABELS[best.platform]} נראה מבטיח עד כה.`,
      score: 40,
      platform: best.platform
    });
  }

  return insights;
}

export function buildMotivationState(ctx: InsightContext): MotivationState {
  const streak = computeWorkStreak(ctx.shiftDays);
  const net = ctx.weekTotals.net;
  const hours = ctx.weekTotals.hours;

  let level: MotivationState["level"] = "starter";
  if (net >= 1200 || hours >= 25) level = "elite";
  else if (net >= 700 || hours >= 18) level = "pro";
  else if (net >= 350 || hours >= 10) level = "growing";

  const headlines: Record<MotivationState["level"], string[]> = {
    starter: ["כל משמרת בונה אותך", "התחלה חכמה", "בדרך למעלה"],
    growing: ["מתקדם יפה", "המומנטום איתך", "עוד קצת ואתה שם"],
    pro: ["שליח/ה מקצועי/ת", "ביצועים חזקים", "כמעט בפסגה"],
    elite: ["אלוף/ת השבוע", "רמה גבוהה", "כך עושים את זה"]
  };

  const emojis: Record<MotivationState["level"], string> = {
    starter: "🚀",
    growing: "📈",
    pro: "⭐",
    elite: "🏆"
  };

  const pick = headlines[level][Math.floor(net / 100) % headlines[level].length];
  const vsLast = percentDelta(ctx.weekTotals.net, ctx.lastWeekTotals.net);
  let subline = `${ctx.weekTotals.activeDays} ימי עבודה · ₪${net.toFixed(0)} נטו`;
  if (vsLast !== null && vsLast > 0) subline += ` · +${vsLast}% מהשבוע שעבר`;
  if (streak >= 2) subline += ` · רצף ${streak} ימים`;

  return {
    headline: pick,
    subline,
    emoji: emojis[level],
    streakDays: streak,
    weeklyNetProfit: net,
    weeklyHours: hours,
    level
  };
}
