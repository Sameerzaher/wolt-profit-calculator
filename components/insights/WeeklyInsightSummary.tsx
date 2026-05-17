"use client";

import MetricCard from "@/components/courier/MetricCard";
import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import type { WeeklyInsightSummary as WeeklySummary } from "@/types/insights";
import { PLATFORM_LABELS } from "@/types/platform";
import { formatHebrewDate } from "@/utils/dates";

export default function WeeklyInsightSummary({ summary }: { summary: WeeklySummary }) {
  return (
    <section className="space-y-3">
      <GlassCard variant="strong">
        <p className="text-label">סיכום שבועי</p>
        <p className="mt-1 text-xl font-black text-white">{summary.headline}</p>
        <p className="mt-1 text-sm text-slate-500">
          {formatHebrewDate(summary.startDate)} → {formatHebrewDate(summary.endDate)}
        </p>
        {summary.vsLastWeekNetPercent !== null ? (
          <p
            className={`mt-2 text-base font-bold ${
              summary.vsLastWeekNetPercent >= 0 ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {summary.vsLastWeekNetPercent >= 0 ? "+" : ""}
            {summary.vsLastWeekNetPercent}% לעומת השבוע שעבר
          </p>
        ) : null}
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="הכנסה" value={`₪${summary.totalIncome.toFixed(0)}`} accent="emerald" />
        <MetricCard label="רווח נטו" value={`₪${summary.netProfit.toFixed(0)}`} accent="emerald" large />
        <MetricCard label="נטו לשעה" value={`₪${summary.netProfitPerHour.toFixed(1)}`} accent="sky" />
        <MetricCard label="משלוחים" value={String(summary.totalDeliveries)} />
        <MetricCard label="דלק" value={`₪${summary.fuelCost.toFixed(0)}`} accent="amber" />
        <MetricCard label="קבועות" value={`₪${summary.fixedCost.toFixed(0)}`} />
      </div>

      {summary.bestPlatform ? (
        <GlassCard variant="elevated" className="flex items-center justify-between gap-2">
          <div>
            <p className="text-label">הפלטפורמה המובילה השבוע</p>
            <p className="mt-1 text-lg font-black text-white">{PLATFORM_LABELS[summary.bestPlatform]}</p>
          </div>
          <PlatformBadge platform={summary.bestPlatform} />
        </GlassCard>
      ) : null}
    </section>
  );
}
