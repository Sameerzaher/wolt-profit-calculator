"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeliveryPlatform } from "@/types/platform";
import type { OcrExtractionDraft, OcrFlowStep, OcrProcessProgress, OcrUploadItem } from "@/types/ocr";
import { mergeExtractions, parseScreenshotText } from "@/utils/ocr/parsers";
import { ocrErrorMessage, runOcrOnImage } from "@/utils/ocr/ocrEngine";

function createUploadItem(file: File): OcrUploadItem {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file)
  };
}

export function useScreenshotOcr() {
  const [step, setStep] = useState<OcrFlowStep>("upload");
  const [platform, setPlatform] = useState<DeliveryPlatform>("wolt");
  const [uploads, setUploads] = useState<OcrUploadItem[]>([]);
  const [draft, setDraft] = useState<OcrExtractionDraft | null>(null);
  const [progress, setProgress] = useState<OcrProcessProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    return () => {
      for (const item of uploads) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [uploads]);

  const addFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("נא לבחור קובצי תמונה (JPG, PNG)");
      return;
    }
    setUploads((prev) => [...prev, ...list.map(createUploadItem)]);
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setUploads((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
    setDraft(null);
    setProgress(null);
    setError(null);
    setStep("upload");
  }, []);

  const runOcr = useCallback(async () => {
    if (uploads.length === 0) {
      setError(ocrErrorMessage("NO_FILES"));
      return;
    }

    setError(null);
    setStep("processing");
    const drafts: OcrExtractionDraft[] = [];

    try {
      for (let i = 0; i < uploads.length; i += 1) {
        const item = uploads[i];
        setProgress({
          imageIndex: i + 1,
          imageTotal: uploads.length,
          percent: 0,
          statusText: `מעבד תמונה ${i + 1} מתוך ${uploads.length}...`
        });

        const text = await runOcrOnImage(item.file, (engineProgress) => {
          setProgress({
            imageIndex: i + 1,
            imageTotal: uploads.length,
            percent: engineProgress.percent,
            statusText: engineProgress.statusText
          });
        });

        drafts.push(parseScreenshotText(platform, text));
      }

      const merged = mergeExtractions(drafts);
      if (!merged) {
        setError(ocrErrorMessage("OCR_EMPTY"));
        setStep("upload");
        return;
      }

      setDraft(merged);
      setStep("review");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "UNKNOWN";
      setError(ocrErrorMessage(msg));
      setStep("upload");
    } finally {
      setProgress(null);
    }
  }, [platform, uploads]);

  const updateDraft = useCallback((patch: Partial<OcrExtractionDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const resetToUpload = useCallback(() => {
    setDraft(null);
    setStep("upload");
    setError(null);
  }, []);

  return {
    step,
    setStep,
    platform,
    setPlatform,
    uploads,
    addFiles,
    removeUpload,
    clearAll,
    draft,
    updateDraft,
    progress,
    error,
    setError,
    showRawText,
    setShowRawText,
    runOcr,
    resetToUpload
  };
}
