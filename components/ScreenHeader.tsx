"use client";

import { FadeIn } from "@/components/ui/motion";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function ScreenHeader({ title, subtitle, action }: Props) {
  return (
    <FadeIn>
      <header className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-display-sm text-white">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-base leading-relaxed text-slate-400">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
    </FadeIn>
  );
}
