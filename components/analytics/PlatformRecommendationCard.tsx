"use client";

import type { PlatformRecommendation } from "@/src/types/platform-analytics";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/src/types/delivery-platform";

const accentRing: Record<string, string> = {
  emerald: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-slate-900",
  sky: "border-sky-500/40 bg-gradient-to-br from-sky-500/15 to-slate-900",
  amber: "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-slate-900"
};

export default function PlatformRecommendationCard({ recommendation }: { recommendation: PlatformRecommendation }) {
  const platform = recommendation.platform;
  const tone = platform ? PLATFORM_COLORS[platform] : "emerald";
  const ring = accentRing[tone] ?? accentRing.emerald;

  return (
    <section className={`rounded-2xl border p-5 ${ring}`}>
      <p className="text-lg font-black leading-snug text-white">{recommendation.title}</p>
      <p className="mt-3 break-words text-sm leading-relaxed text-slate-200">{recommendation.message}</p>
      {platform ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-white">{PLATFORM_LABELS[platform]}</p>
          <p className="text-lg font-black text-emerald-300 sm:text-xl" dir="ltr">
            ₪{recommendation.netProfitPerHour.toFixed(1)}/שעה נטו
          </p>
        </div>
      ) : null}
    </section>
  );
}
