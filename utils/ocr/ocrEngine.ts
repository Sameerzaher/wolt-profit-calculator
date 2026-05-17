import { normalizeOcrText } from "@/utils/ocr/textNormalize";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.88;

export type OcrEngineProgress = {
  percent: number;
  statusText: string;
};

/** Resize large mobile photos before OCR for speed and accuracy. */
export async function preprocessImageForOcr(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.filter = "contrast(1.08) brightness(1.02)";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );
  return blob ?? file;
}

export async function runOcrOnImage(
  file: File,
  onProgress?: (progress: OcrEngineProgress) => void
): Promise<string> {
  const preprocessed = await preprocessImageForOcr(file);
  onProgress?.({ percent: 5, statusText: "טוען מנוע OCR..." });

  let tesseract: typeof import("tesseract.js");
  try {
    tesseract = await import("tesseract.js");
  } catch {
    throw new Error("OCR_ENGINE_LOAD");
  }

  onProgress?.({ percent: 12, statusText: "מזהה טקסט (עברית + אנגלית)..." });

  const result = await tesseract.recognize(preprocessed, "eng+heb", {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        const pct = 12 + Math.round(message.progress * 83);
        onProgress?.({ percent: pct, statusText: "מזהה טקסט..." });
      }
    }
  });

  onProgress?.({ percent: 98, statusText: "מעבד תוצאות..." });
  const text = normalizeOcrText(result.data.text ?? "");
  if (!text.trim()) {
    throw new Error("OCR_EMPTY");
  }
  onProgress?.({ percent: 100, statusText: "הושלם" });
  return text;
}

export function ocrErrorMessage(code: string): string {
  switch (code) {
    case "OCR_ENGINE_LOAD":
      return "לא ניתן לטעון את מנוע ה-OCR. נסו רענון מלא של האפליקציה.";
    case "OCR_EMPTY":
      return "לא זוהה טקסט בתמונה. נסו צילום מסך ברור יותר או תאורה טובה יותר.";
    case "NO_FILES":
      return "בחרו לפחות תמונה אחת.";
  }
  return "שגיאה בעיבוד התמונה. נסו שוב.";
}
