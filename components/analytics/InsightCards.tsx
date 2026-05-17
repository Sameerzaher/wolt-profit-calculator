"use client";

import MetricCard from "@/components/courier/MetricCard";
import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import type { AnalyticsReport } from "@/types/analytics";

export default function InsightCards({ report }: { report: AnalyticsReport }) {
  const { totals, bestDay, worstDay, bestPlatform, bestHourRange, byPlatform } = report;
  const bestPlatformRow = bestPlatform ? byPlatform.find((p) => p.platform === bestPlatform) : null;

  return (
    <section className="grid grid-cols-2 gap-3">
      <MetricCard
        label="היום הכי משתלם"
        value={bestDay ? `₪${bestDay.netProfit.toFixed(0)}` : "—"}
        hint={bestDay?.label}
        accent="emerald"
      />
      <MetricCard
        label="היום הכי חלש"
        value={worstDay ? `₪${worstDay.netProfit.toFixed(0)}` : "—"}
        hint={worstDay?.label}
        accent="amber"
      />
      <GlassCard variant="elevated" className="col-span-2">
        <p className="text-label">הפלטפורמה הכי משתלמת</p>
        {bestPlatform ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <PlatformBadge platform={bestPlatform} />
            <p className="text-stat text-emerald-300">
              ₪{bestPlatformRow?.netProfitPerHour.toFixed(1) ?? "0"}/שעה
            </p>
          </div>
        ) : (
          <p className="mt-2 text-base text-slate-500">אין נתונים</p>
        )}
      </GlassCard>
      <MetricCard
        label="טווח שעות משתלם"
        value={bestHourRange ? `₪${bestHourRange.netProfitPerHour.toFixed(1)}` : "—"}
        hint={bestHourRange?.label}
        accent="sky"
      />
      <MetricCard
        label="ממוצע הכנסה למקטע"
        value={`₪${totals.averageIncomePerShift.toFixed(0)}`}
        hint={`${totals.totalShifts} מקטעים`}
      />
      <MetricCard label="סה״כ משלוחים" value={String(totals.totalDeliveries)} accent="white" large />
    </section>
  );
}
