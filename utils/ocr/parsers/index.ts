import type { DeliveryPlatform } from "@/types/platform";
import type { OcrExtractionDraft } from "@/types/ocr";
import { parseHaAtScreenshot } from "@/utils/ocr/parsers/haat";
import { parseTenBisScreenshot } from "@/utils/ocr/parsers/tenbis";
import { parseWoltScreenshot } from "@/utils/ocr/parsers/wolt";
import { normalizeOcrText } from "@/utils/ocr/textNormalize";

export function parseScreenshotText(platform: DeliveryPlatform, rawText: string): OcrExtractionDraft {
  const normalized = normalizeOcrText(rawText);
  switch (platform) {
    case "wolt":
      return parseWoltScreenshot(normalized);
    case "tenbis":
      return parseTenBisScreenshot(normalized);
    case "haat":
      return parseHaAtScreenshot(normalized);
    default:
      return parseWoltScreenshot(normalized);
  }
}

export function mergeExtractions(drafts: OcrExtractionDraft[]): OcrExtractionDraft | null {
  if (drafts.length === 0) return null;
  if (drafts.length === 1) return drafts[0];

  const base = { ...drafts[0] };
  for (let i = 1; i < drafts.length; i += 1) {
    const next = drafts[i];
    if (next.income > base.income) base.income = next.income;
    if (next.deliveriesCount > base.deliveriesCount) base.deliveriesCount = next.deliveriesCount;
    if (next.bonuses > base.bonuses) base.bonuses = next.bonuses;
    if (next.shiftDurationHours > base.shiftDurationHours) base.shiftDurationHours = next.shiftDurationHours;
    base.rawText += `\n---\n${next.rawText}`;
  }
  return base;
}
