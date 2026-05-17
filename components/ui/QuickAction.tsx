"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ScaleTap } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

type QuickActionProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: "emerald" | "sky" | "violet" | "neutral";
};

const toneClass = {
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  sky: "border-sky-400/25 bg-sky-500/10 text-sky-200",
  violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  neutral: "border-white/10 bg-white/[0.04] text-slate-300"
};

export default function QuickAction({ href, label, icon: Icon, tone = "neutral" }: QuickActionProps) {
  return (
    <ScaleTap>
      <Link
        href={href}
        className={cn(
          "flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-2xl border p-4 backdrop-blur-sm transition",
          toneClass[tone]
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
        <span className="text-sm font-bold">{label}</span>
      </Link>
    </ScaleTap>
  );
}
