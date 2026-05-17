"use client";

import PlatformStatsCard from "@/components/courier/PlatformStatsCard";
import type { AnalyticsReport } from "@/types/analytics";
import { PLATFORM_LABELS } from "@/types/platform";

export default function PlatformComparisonSection({ report }: { report: AnalyticsReport }) {
  const { byPlatform, comparison } = report;
  const active = byPlatform.filter((p) => p.shiftCount > 0);

  if (active.length === 0) {
    return (
      <section className="app-card text-center text-base text-slate-400">
        אין נתוני פלטפורמות לתקופה זו
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-label px-1">השוואת פלטפורמות</h2>

      {comparison.bestNetProfitPerHour ? (
        <div className="glass-elevated border border-sky-400/25 px-4 py-4 text-base text-slate-200">
          <span className="font-bold text-sky-200">₪ לשעה הכי גבוה: </span>
          {PLATFORM_LABELS[comparison.bestNetProfitPerHour.platform]} — ₪
          {comparison.bestNetProfitPerHour.value.toFixed(1)} נטו לשעה
        </div>
      ) : null}

      {comparison.bestIncomePerKm ? (
        <div className="glass-elevated border border-amber-400/25 px-4 py-4 text-base text-slate-200">
          <span className="font-bold text-amber-200">₪ לק״מ הכי גבוה: </span>
          {PLATFORM_LABELS[comparison.bestIncomePerKm.platform]} — ₪
          {comparison.bestIncomePerKm.value.toFixed(2)} לק״מ
        </div>
      ) : null}

      <div className="space-y-3">
        {active.map((row) => (
          <PlatformStatsCard key={row.platform} stats={row} />
        ))}
      </div>
    </section>
  );
}
