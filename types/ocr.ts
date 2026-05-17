import type { DeliveryPlatform } from "@/types/platform";

export type OcrFlowStep = "upload" | "processing" | "review" | "saved";

export type ExtractedField =
  | "income"
  | "bonuses"
  | "deliveriesCount"
  | "date"
  | "startTime"
  | "endTime"
  | "shiftDurationHours"
  | "kilometers";

export interface FieldConfidence {
  field: ExtractedField;
  confidence: number;
  hint: string;
}

export interface OcrExtractionDraft {
  platform: DeliveryPlatform;
  rawText: string;
  income: number;
  bonuses: number;
  deliveriesCount: number;
  date: string;
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
  shiftDurationHours: number;
  kilometers: number;
  fieldConfidences: FieldConfidence[];
  overallConfidence: number;
}

export interface OcrUploadItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface OcrProcessProgress {
  imageIndex: number;
  imageTotal: number;
  percent: number;
  statusText: string;
}
