"use client";

import type { OcrFlowStep } from "@/types/ocr";
import { cn } from "@/lib/cn";

const STEPS: { id: OcrFlowStep; label: string }[] = [
  { id: "upload", label: "העלאה" },
  { id: "processing", label: "OCR" },
  { id: "review", label: "בדיקה" },
  { id: "saved", label: "שמירה" }
];

export default function OcrFlowStepper({ current }: { current: OcrFlowStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="glass grid grid-cols-4 gap-1.5 p-1.5 text-center text-xs font-bold">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === current || (current === "processing" && step.id === "processing");
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-xl px-1 py-2.5 transition",
              active
                ? "border border-emerald-400/40 bg-emerald-500/25 text-emerald-50 shadow-glow"
                : done
                  ? "border border-white/10 bg-white/[0.06] text-slate-300"
                  : "text-slate-500"
            )}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
