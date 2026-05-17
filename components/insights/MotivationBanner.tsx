"use client";

import type { MotivationState } from "@/types/insights";

const LEVEL_LABELS: Record<MotivationState["level"], string> = {
  starter: "מתחיל/ה",
  growing: "בצמיחה",
  pro: "מקצועי/ת",
  elite: "עלית"
};

export default function MotivationBanner({ motivation }: { motivation: MotivationState }) {
  return (
    <section className="glass-strong p-6">
      <div className="flex items-start gap-4">
        <span className="text-5xl" aria-hidden>
          {motivation.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label text-violet-300">
            {LEVEL_LABELS[motivation.level]}
            {motivation.streakDays >= 2 ? ` · רצף ${motivation.streakDays} ימים` : ""}
          </p>
          <h2 className="mt-1 text-display-sm font-black leading-snug text-white">{motivation.headline}</h2>
          <p className="mt-2 text-base text-slate-300">{motivation.subline}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="glass rounded-xl px-3 py-3">
          <p className="text-label">נטו השבוע</p>
          <p className="text-stat text-emerald-300">₪{motivation.weeklyNetProfit.toFixed(0)}</p>
        </div>
        <div className="glass rounded-xl px-3 py-3">
          <p className="text-label">שעות השבוע</p>
          <p className="text-stat text-sky-300">{motivation.weeklyHours.toFixed(1)}</p>
        </div>
      </div>
    </section>
  );
}
