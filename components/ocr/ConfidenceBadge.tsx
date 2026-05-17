"use client";

import { confidenceLabel } from "@/utils/ocr/confidence";

export default function ConfidenceBadge({ score }: { score: number }) {
  const { label, className } = confidenceLabel(score);
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${className}`}>
      {Math.round(score * 100)}% · {label}
    </span>
  );
}
