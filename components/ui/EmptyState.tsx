"use client";

import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import GlassCard from "@/components/ui/GlassCard";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <FadeIn>
      <GlassCard variant="elevated" className="flex flex-col items-center py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <Icon className="h-8 w-8 text-emerald-400" strokeWidth={1.75} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 max-w-[18rem] text-base leading-relaxed text-slate-400">{description}</p>
        {action ? <div className="mt-6 w-full max-w-xs">{action}</div> : null}
      </GlassCard>
    </FadeIn>
  );
}
