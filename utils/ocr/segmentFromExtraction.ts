import type { OcrExtractionDraft } from "@/types/ocr";
import type { ShiftSegment } from "@/types/shift";
import { createEmptySegment } from "@/utils/calculations";
import { durationToEndTime } from "@/utils/ocr/parsers/common";

export function extractionToSegment(draft: OcrExtractionDraft): ShiftSegment {
  const segment = createEmptySegment(draft.platform);
  const endTime =
    draft.endTime ||
    durationToEndTime(draft.startTime, draft.shiftDurationHours, draft.endsNextDay);

  const notesParts = ["יובא מצילום מסך (OCR)"];
  if (draft.bonuses > 0) {
    notesParts.push(`בונוס: ₪${draft.bonuses.toFixed(2)}`);
  }
  if (draft.rawText.length > 0) {
    notesParts.push(`ביטחון: ${Math.round(draft.overallConfidence * 100)}%`);
  }

  return {
    ...segment,
    startTime: draft.startTime,
    endTime,
    endsNextDay: draft.endsNextDay,
    income: draft.income,
    deliveriesCount: Math.max(0, Math.round(draft.deliveriesCount)),
    kilometers: Math.max(0, draft.kilometers),
    notes: notesParts.join(" · ")
  };
}
