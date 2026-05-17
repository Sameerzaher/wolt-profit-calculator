"use client";

import type { DeliveryPlatform, PlatformComparison, PlatformDayStats } from "@/types/models";
import { PLATFORM_LABELS } from "@/src/types/delivery-platform";

type PlatformComparisonCardProps = {
  comparison: PlatformComparison;
  byPlatform: PlatformDayStats[];
};

export default function PlatformComparisonCard({ comparison, byPlatform }: PlatformComparisonCardProps) {
  if (byPlatform.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-lg font-black text-white">השוואת פלטפורמות</h2>

      <div className="mt-3 space-y-2">
        {comparison.bestNetProfitPerHour ? (
          <Highlight
            label="הכי משתלם לשעה (נטו)"
            platform={comparison.bestNetProfitPerHour.platform}
            value={`₪${comparison.bestNetProfitPerHour.value.toFixed(1)}/שעה`}
            tone="emerald"
          />
        ) : null}
        {comparison.bestIncomePerKm ? (
          <Highlight
            label="הכי משתלם לק״מ (הכנסה)"
            platform={comparison.bestIncomePerKm.platform}
            value={`₪${comparison.bestIncomePerKm.value.toFixed(2)}/ק״מ`}
            tone="sky"
          />
        ) : null}
        {comparison.worstPlatformToday ? (
          <Highlight
            label="הכי פחות משתלם היום"
            platform={comparison.worstPlatformToday}
            value={PLATFORM_LABELS[comparison.worstPlatformToday]}
            tone="amber"
          />
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {byPlatform.map((row) => (
          <article key={row.platform} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-sm font-bold text-white">{PLATFORM_LABELS[row.platform]}</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
              <p>הכנסה: ₪{row.income.toFixed(0)}</p>
              <p>שעות: {row.hours.toFixed(2)}</p>
              <p>נטו: ₪{row.netProfit.toFixed(1)}</p>
              <p>נטו/שעה: ₪{row.netProfitPerHour.toFixed(1)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Highlight({
  label,
  platform,
  value,
  tone
}: {
  label: string;
  platform: DeliveryPlatform;
  value: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const border =
    tone === "emerald" ? "border-emerald-500/40 bg-emerald-500/10" : tone === "sky" ? "border-sky-500/40 bg-sky-500/10" : "border-amber-500/40 bg-amber-500/10";
  return (
    <div className={`rounded-xl border p-3 ${border}`}>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white">
        {PLATFORM_LABELS[platform]} · {value}
      </p>
    </div>
  );
}
