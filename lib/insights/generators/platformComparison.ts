import { PLATFORM_LABELS } from "@/types/platform";
import type { CourierInsight } from "@/types/insights";
import type { InsightContext } from "@/lib/insights/context";
import { finalizeInsightScore } from "@/lib/insights/scoring";

export function generatePlatformInsights(ctx: InsightContext): CourierInsight[] {
  const insights: CourierInsight[] = [];
  const active = ctx.weekByPlatform.filter((p) => p.totalHours > 0);
  if (active.length === 0) return insights;

  const best = active.reduce((a, b) => (b.netProfitPerHour > a.netProfitPerHour ? b : a));
  const worst = active.length >= 2 ? active.reduce((a, b) => (b.netProfitPerHour < a.netProfitPerHour ? b : a)) : null;

  insights.push({
    id: `platform-best-${best.platform}`,
    category: "platform_comparison",
    tone: "recommendation",
    title: `${PLATFORM_LABELS[best.platform]} — הכי משתלם לשעה`,
    message: `${PLATFORM_LABELS[best.platform]} נותן לך את הרווח הנטו הגבוה ביותר לשעה השבוע — ₪${best.netProfitPerHour.toFixed(1)}.`,
    score: finalizeInsightScore(92, best.shiftCount),
    metric: `₪${best.netProfitPerHour.toFixed(1)}/שעה`,
    platform: best.platform
  });

  if (worst && worst.platform !== best.platform && best.netProfitPerHour > worst.netProfitPerHour * 1.15) {
    const gap = Math.round(((best.netProfitPerHour - worst.netProfitPerHour) / worst.netProfitPerHour) * 100);
    insights.push({
      id: `platform-gap-${worst.platform}`,
      category: "platform_comparison",
      tone: "insight",
      title: `פער של ${gap}% בין פלטפורמות`,
      message: `${PLATFORM_LABELS[best.platform]} משתלם ב-${gap}% יותר מ-${PLATFORM_LABELS[worst.platform]} לשעה השבוע.`,
      score: finalizeInsightScore(80, worst.shiftCount + best.shiftCount),
      metric: `+${gap}%`,
      platform: best.platform
    });
  }

  const lowShare = active.find((p) => p.shiftCount >= 2 && p.netProfitPerHour < best.netProfitPerHour * 0.7);
  if (lowShare && lowShare.platform !== best.platform) {
    insights.push({
      id: `platform-reduce-${lowShare.platform}`,
      category: "platform_comparison",
      tone: "warning",
      title: `שקול לצמצם ${PLATFORM_LABELS[lowShare.platform]}`,
      message: `${PLATFORM_LABELS[lowShare.platform]} מחזיר רק ₪${lowShare.netProfitPerHour.toFixed(1)} נטו לשעה — פחות מחצי מ-${PLATFORM_LABELS[best.platform]}.`,
      score: finalizeInsightScore(74, lowShare.shiftCount),
      platform: lowShare.platform
    });
  }

  return insights;
}
