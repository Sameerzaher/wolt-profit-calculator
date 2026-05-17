import type { CourierInsight } from "@/types/insights";

/** Clamp and normalize insight scores for ranking. */
export function finalizeInsightScore(base: number, dataPoints: number, minPoints = 2): number {
  if (dataPoints < minPoints) return Math.round(base * 0.55);
  return Math.min(100, Math.max(0, Math.round(base)));
}

export function sortInsights(items: CourierInsight[]): CourierInsight[] {
  return [...items].sort((a, b) => b.score - a.score);
}

export function pickTopInsight(items: CourierInsight[]): CourierInsight | null {
  if (items.length === 0) return null;
  return sortInsights(items)[0];
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0 || current <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
