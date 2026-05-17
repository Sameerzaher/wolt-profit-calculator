"use client";

import { motion } from "framer-motion";
import type { AnalyticsPeriod } from "@/types/analytics";
import { cn } from "@/lib/cn";

const TABS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "week", label: "שבוע" },
  { id: "month", label: "חודש" },
  { id: "all", label: "הכל" }
];

export default function PeriodTabs({
  value,
  onChange
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  return (
    <div className="glass grid grid-cols-3 gap-1.5 p-1.5">
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative min-h-[3rem] rounded-xl text-sm font-bold transition-colors",
              active ? "text-emerald-50" : "text-slate-400"
            )}
          >
            {active ? (
              <motion.span
                layoutId="period-pill"
                className="absolute inset-0 rounded-xl border border-emerald-400/40 bg-emerald-500/25 shadow-glow"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
