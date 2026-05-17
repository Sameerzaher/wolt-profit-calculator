import type { ExtractedField, FieldConfidence } from "@/types/ocr";
import { clamp01, round2 } from "@/utils/ocr/textNormalize";

export function fieldConfidence(
  field: ExtractedField,
  confidence: number,
  hint: string
): FieldConfidence {
  return { field, confidence: round2(clamp01(confidence)), hint };
}

export function overallConfidence(fields: FieldConfidence[]): number {
  if (fields.length === 0) return 0;
  const weights: Partial<Record<ExtractedField, number>> = {
    income: 0.28,
    date: 0.18,
    deliveriesCount: 0.14,
    shiftDurationHours: 0.14,
    startTime: 0.1,
    endTime: 0.1,
    bonuses: 0.04,
    kilometers: 0.02
  };
  let sum = 0;
  let weightSum = 0;
  for (const item of fields) {
    const w = weights[item.field] ?? 0.05;
    sum += item.confidence * w;
    weightSum += w;
  }
  return round2(weightSum > 0 ? sum / weightSum : 0);
}

export function confidenceLabel(score: number): { label: string; className: string } {
  if (score >= 0.75) return { label: "גבוה", className: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" };
  if (score >= 0.45) return { label: "בינוני", className: "text-amber-200 bg-amber-500/15 border-amber-500/30" };
  return { label: "נמוך", className: "text-rose-200 bg-rose-500/15 border-rose-500/30" };
}
