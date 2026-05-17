"use client";

import { cn } from "@/lib/cn";
import GlassCard from "@/components/ui/GlassCard";
import { StaggerItem } from "@/components/ui/motion";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "sky" | "amber" | "white";
  large?: boolean;
  icon?: React.ReactNode;
};

const accentClass: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  emerald: "text-emerald-300",
  sky: "text-sky-300",
  amber: "text-amber-200",
  white: "text-white"
};

export default function MetricCard({
  label,
  value,
  hint,
  accent = "white",
  large,
  icon
}: MetricCardProps) {
  return (
    <StaggerItem>
      <GlassCard variant={large ? "strong" : "default"} padding="md" className="h-full">
        <div className="flex items-start justify-between gap-2">
          <p className="text-label">{label}</p>
          {icon ? <span className="text-emerald-400/80">{icon}</span> : null}
        </div>
        <p
          className={cn(
            "mt-2 font-extrabold tracking-tight",
            accentClass[accent],
            large ? "text-stat" : "text-2xl"
          )}
          dir="ltr"
        >
          {value}
        </p>
        {hint ? <p className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
      </GlassCard>
    </StaggerItem>
  );
}
