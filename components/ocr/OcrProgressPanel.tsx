"use client";

import type { OcrProcessProgress } from "@/types/ocr";

export default function OcrProgressPanel({ progress }: { progress: OcrProcessProgress }) {
  return (
    <section className="app-card space-y-3">
      <p className="text-sm font-bold text-white">מעבד צילומי מסך...</p>
      <p className="text-xs text-slate-400">
        תמונה {progress.imageIndex} מתוך {progress.imageTotal} · {progress.statusText}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
      <p className="text-center text-xs font-bold text-emerald-300">{progress.percent}%</p>
    </section>
  );
}
