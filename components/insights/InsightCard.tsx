"use client";

import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import type { CourierInsight } from "@/types/insights";
import { cn } from "@/lib/cn";

const TONE_STYLES: Record<CourierInsight["tone"], string> = {
  insight: "border-sky-400/25 bg-sky-500/8",
  recommendation: "border-emerald-400/25 bg-emerald-500/8",
  warning: "border-amber-400/30 bg-amber-500/10",
  motivation: "border-violet-400/25 bg-violet-500/8"
};

const TONE_LABELS: Record<CourierInsight["tone"], string> = {
  insight: "תובנה",
  recommendation: "המלצה",
  warning: "אזהרה",
  motivation: "מוטיבציה"
};

export default function InsightCard({ insight, compact }: { insight: CourierInsight; compact?: boolean }) {
  return (
    <GlassCard
      padding={compact ? "sm" : "md"}
      className={cn("border", TONE_STYLES[insight.tone])}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs font-bold text-slate-400">
          {TONE_LABELS[insight.tone]}
        </span>
        {insight.metric ? (
          <span className="ms-auto text-sm font-extrabold text-emerald-300" dir="ltr">
            {insight.metric}
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 font-bold text-white", compact ? "text-base" : "text-lg")}>{insight.title}</p>
      <p className="mt-1.5 text-base leading-relaxed text-slate-300">{insight.message}</p>
      {insight.platform ? (
        <div className="mt-3">
          <PlatformBadge platform={insight.platform} />
        </div>
      ) : null}
    </GlassCard>
  );
}
