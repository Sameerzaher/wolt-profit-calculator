"use client";

import GlassCard from "@/components/ui/GlassCard";
import type { AnalyticsInsight } from "@/types/analytics";

export default function InsightsList({ insights }: { insights: AnalyticsInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-label px-1">המלצות חכמות</h2>
      <ul className="space-y-2">
        {insights.map((item) => (
          <li key={item.id}>
            <GlassCard
              padding="sm"
              className="border border-emerald-400/20 bg-emerald-500/8 text-base leading-relaxed text-slate-200"
            >
              {item.message}
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
