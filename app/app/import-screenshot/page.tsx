"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ExtractionReviewForm from "@/components/ocr/ExtractionReviewForm";
import OcrFlowStepper from "@/components/ocr/OcrFlowStepper";
import OcrProgressPanel from "@/components/ocr/OcrProgressPanel";
import ScreenshotUploadZone from "@/components/ocr/ScreenshotUploadZone";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import StickyActionBar from "@/components/ui/StickyActionBar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useScreenshotOcr } from "@/hooks/useScreenshotOcr";
import { extractionToSegment } from "@/utils/ocr/segmentFromExtraction";

export default function ImportScreenshotPage() {
  const router = useRouter();
  const { isHydrated, ensureDay, saveShiftDay } = useCourier();
  const ocr = useScreenshotOcr();

  const handleSave = () => {
    if (!ocr.draft) return;
    const segment = extractionToSegment(ocr.draft);
    const day = ensureDay(ocr.draft.date);
    saveShiftDay({
      ...day,
      segments: [...day.segments, segment]
    });
    ocr.setStep("saved");
  };

  if (!isHydrated) {
    return <PageSkeleton />;
  }

  return (
    <main className={`app-page space-y-4 ${ocr.step === "upload" || ocr.step === "review" ? "app-page-sticky" : ""}`}>
      <ScreenHeader
        title="ייבוא מצילום מסך"
        subtitle="העלאה → OCR → בדיקה → שמירה למשמרת"
      />

      <OcrFlowStepper current={ocr.step} />

      {ocr.error ? (
        <p className="glass rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-base text-rose-100">
          {ocr.error}
        </p>
      ) : null}

      {ocr.step === "upload" ? (
        <>
          <ScreenshotUploadZone
            platform={ocr.platform}
            onPlatformChange={ocr.setPlatform}
            uploads={ocr.uploads}
            onAddFiles={ocr.addFiles}
            onRemove={ocr.removeUpload}
          />
          <StickyActionBar>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={ocr.clearAll}
                disabled={ocr.uploads.length === 0}
                className="btn-secondary min-h-[3rem] disabled:opacity-40"
              >
                נקה הכל
              </button>
              <button
                type="button"
                onClick={ocr.runOcr}
                disabled={ocr.uploads.length === 0}
                className="btn-primary min-h-[3rem] disabled:opacity-40"
              >
                התחל זיהוי OCR
              </button>
            </div>
          </StickyActionBar>
        </>
      ) : null}

      {ocr.step === "processing" && ocr.progress ? <OcrProgressPanel progress={ocr.progress} /> : null}

      {ocr.step === "review" && ocr.draft ? (
        <>
          <ExtractionReviewForm
            draft={ocr.draft}
            onChange={ocr.updateDraft}
            showRawText={ocr.showRawText}
            onToggleRawText={() => ocr.setShowRawText((v) => !v)}
          />
          <StickyActionBar>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={ocr.resetToUpload}
                className="btn-secondary min-h-[3rem]"
              >
                חזרה
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary min-h-[3rem]"
              >
                שמור מקטע משמרת
              </button>
            </div>
          </StickyActionBar>
        </>
      ) : null}

      {ocr.step === "saved" && ocr.draft ? (
        <section className="glass-strong space-y-4 p-6 text-center">
          <p className="text-2xl font-black text-emerald-300">נשמר בהצלחה</p>
          <p className="text-base text-slate-300">
            מקטע {ocr.draft.platform} נוסף ליום {ocr.draft.date}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={`/app/add-shift?date=${ocr.draft.date}`}
              className="btn-secondary min-h-[3rem] border-emerald-500/40 text-emerald-200"
            >
              ערוך משמרת
            </Link>
            <button
              type="button"
              onClick={() => {
                ocr.clearAll();
                ocr.resetToUpload();
              }}
              className="btn-primary min-h-[3rem]"
            >
              ייבוא נוסף
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="text-xs font-bold text-slate-500 underline"
          >
            חזרה ללוח הבקרה
          </button>
        </section>
      ) : null}
    </main>
  );
}
