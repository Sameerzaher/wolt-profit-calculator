"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ScreenHeader from "@/components/ScreenHeader";
import { buildShiftAnalysis, dedupeTasks, detectShiftDateFromText, parseTasksFromOcrText } from "@/features/screenshot-analyzer/analysis";
import { readShiftAnalysisByDate, saveShiftAnalysisByDate } from "@/lib/storage";
import type { DeliveryTask } from "@/types/models";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type OcrProgress = {
  imageIndex: number;
  percent: number;
};

const DEFAULT_COST_PER_KM = 0.7;

export default function ScreenshotAnalyzerPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">טוען מנתח צילומים...</p>}>
      <ScreenshotAnalyzerContent />
    </Suspense>
  );
}

function ScreenshotAnalyzerContent() {
  const searchParams = useSearchParams();
  const today = getTodayDateInput();
  const initialDate = searchParams.get("date") ?? today;

  const [shiftDate, setShiftDate] = useState(initialDate);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [rawTexts, setRawTexts] = useState<string[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [actualDrivenKm, setActualDrivenKm] = useState<string>("");
  const [costPerKm, setCostPerKm] = useState<string>(String(DEFAULT_COST_PER_KM));
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const snapshot = readShiftAnalysisByDate(shiftDate);
    if (!snapshot) {
      setTasks([]);
      setRawTexts([]);
      setSuggestedDate(null);
      setActualDrivenKm("");
      setCostPerKm(String(DEFAULT_COST_PER_KM));
      setCreatedAt(new Date().toISOString());
      return;
    }
    setTasks(snapshot.tasks);
    setRawTexts(snapshot.rawTexts);
    setSuggestedDate(snapshot.ocrDetectedDate ?? null);
    setActualDrivenKm(snapshot.actualDrivenKm !== undefined ? String(snapshot.actualDrivenKm) : "");
    setCostPerKm(String(snapshot.costPerKm));
    setCreatedAt(snapshot.createdAt);
  }, [shiftDate]);

  useEffect(() => {
    return () => {
      for (const item of uploads) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [uploads]);

  const actualDrivenKmValue = toOptionalNumber(actualDrivenKm);
  const costPerKmValue = toNumber(costPerKm) ?? DEFAULT_COST_PER_KM;

  const analysis = useMemo(
    () => buildShiftAnalysis(tasks, actualDrivenKmValue, costPerKmValue),
    [tasks, actualDrivenKmValue, costPerKmValue]
  );

  useEffect(() => {
    if (tasks.length === 0) return;
    saveShiftAnalysisByDate({
      shiftDate,
      tasks,
      rawTexts,
      ocrDetectedDate: suggestedDate ?? undefined,
      actualDrivenKm: actualDrivenKmValue,
      costPerKm: costPerKmValue,
      analysis,
      createdAt,
      updatedAt: new Date().toISOString()
    });
  }, [analysis, actualDrivenKmValue, costPerKmValue, createdAt, rawTexts, shiftDate, suggestedDate, tasks]);

  const onPickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const nextItems: UploadItem[] = [...fileList]
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    if (nextItems.length === 0) {
      setError("לא נמצאו קבצי תמונה תקינים.");
      return;
    }

    setError(null);
    setUploads((prev) => [...prev, ...nextItems]);
    event.currentTarget.value = "";
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const analyzeScreenshots = async () => {
    if (uploads.length === 0 || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(null);

      const tesseract = await import("tesseract.js");
      const collectedTexts: string[] = [];
      const collectedTasks: DeliveryTask[] = [];
      let detectedDate: string | undefined;

      for (let imageIndex = 0; imageIndex < uploads.length; imageIndex += 1) {
        const item = uploads[imageIndex];
        const result = await tesseract.recognize(item.file, "eng", {
          logger: (message) => {
            if (message.status === "recognizing text" && typeof message.progress === "number") {
              setProgress({
                imageIndex,
                percent: Math.round(message.progress * 100)
              });
            }
          }
        });

        const text = result.data.text ?? "";
        collectedTexts.push(text);
        detectedDate = detectedDate ?? detectShiftDateFromText(text);
        collectedTasks.push(...parseTasksFromOcrText(text, imageIndex));
      }
      const mergedTasks = dedupeTasks([...tasks, ...collectedTasks]);

      if (mergedTasks.length === 0) {
        setError("לא זוהו שורות משלוחים. נסה תמונות חדות יותר.");
      }
      if (detectedDate) setSuggestedDate(detectedDate);
      setRawTexts((prev) => [...prev, ...collectedTexts]);
      setTasks(mergedTasks);
      setUploads([]);
    } catch (ocrError) {
      console.error(ocrError);
      setError("שגיאה בזמן OCR. נסה שוב עם תמונות אחרות.");
    } finally {
      setProgress(null);
      setIsAnalyzing(false);
    }
  };

  const updateTask = (id: string, patch: Partial<DeliveryTask>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...patch } : task))
    );
  };

  return (
    <main className="space-y-4">
      <ScreenHeader title="ניתוח צילומי מסך" subtitle="העלה צילומים מאפליקציית Wolt וקבל תמונת משמרת" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <label className="mb-2 block text-sm font-bold text-slate-200">תאריך המשמרת</label>
        <input
          type="date"
          value={shiftDate}
          max={today}
          onChange={(event) => setShiftDate(event.target.value || today)}
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
        />
        {suggestedDate ? (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
            זוהה תאריך אפשרי מהצילום: <strong>{suggestedDate}</strong>
            <button
              type="button"
              onClick={() => setShiftDate(suggestedDate)}
              className="mr-2 rounded-lg border border-amber-400/40 px-2 py-1"
            >
              השתמש בתאריך הזה
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <label className="mb-2 block text-sm font-bold text-slate-200">העלאת צילומים</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          className="block w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200"
        />

        {uploads.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">אפשר לבחור כמה תמונות יחד, ואז להסיר מה שלא צריך.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {uploads.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-700">
                <Image src={item.previewUrl} alt={item.file.name} width={200} height={96} className="h-24 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeUpload(item.id)}
                  className="absolute left-1 top-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-white"
                >
                  הסר
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={analyzeScreenshots}
          disabled={uploads.length === 0 || isAnalyzing}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
        >
          {isAnalyzing ? "מנתח צילומים..." : "Analyze screenshots"}
        </button>

        {progress ? (
          <p className="mt-2 text-xs text-slate-300">
            תמונה {progress.imageIndex + 1} מתוך {uploads.length}: {progress.percent}%
          </p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </section>

      {tasks.length > 0 ? (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-200">תיקון ידני אחרי OCR</p>
            <div className="mt-3 space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={task.restaurant}
                      onChange={(e) => updateTask(task.id, { restaurant: e.target.value })}
                      placeholder="מסעדה"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                    <input
                      value={task.time ?? ""}
                      onChange={(e) => updateTask(task.id, { time: e.target.value || undefined })}
                      placeholder="שעה (HH:mm)"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                    <input
                      value={task.distanceKm ?? ""}
                      onChange={(e) => updateTask(task.id, { distanceKm: toOptionalNumber(e.target.value) })}
                      placeholder="מרחק ק״מ"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                    <input
                      value={task.amountIls}
                      onChange={(e) => {
                        const next = toNumber(e.target.value);
                        if (next !== null) updateTask(task.id, { amountIls: next });
                      }}
                      placeholder="סכום ₪"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                    <input
                      value={task.deliveriesCount}
                      onChange={(e) => {
                        const next = toNumber(e.target.value);
                        if (next !== null) updateTask(task.id, { deliveriesCount: Math.max(1, Math.round(next)) });
                      }}
                      placeholder="מספר משלוחים"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                    <input
                      value={task.area ?? ""}
                      onChange={(e) => updateTask(task.id, { area: e.target.value || undefined })}
                      placeholder="אזור / עיר"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-200">חישוב נטו לפי ק״מ אמיתי</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={actualDrivenKm}
                onChange={(e) => setActualDrivenKm(e.target.value)}
                placeholder="ק״מ בפועל"
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
              <input
                value={costPerKm}
                onChange={(e) => setCostPerKm(e.target.value)}
                placeholder="עלות לק״מ"
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4">
            <Metric label="Gross income" value={formatCurrency(analysis.grossIncome)} />
            <Metric label="Net income" value={formatMaybeCurrency(analysis.estimatedNetIncome)} />
            <Metric label="Tasks" value={String(analysis.taskCount)} />
            <Metric label="Real deliveries" value={String(analysis.deliveryCount)} />
            <Metric label="Duration" value={formatDuration(analysis.estimatedDurationHours)} />
            <Metric label="Actual driven km" value={actualDrivenKmValue !== undefined ? String(actualDrivenKmValue) : "-"} />
            <Metric label="Gross/hour" value={formatMaybeCurrency(analysis.grossPerHour)} />
            <Metric label="Net/hour" value={formatMaybeCurrency(analysis.estimatedNetPerHour)} />
            <Metric label="Gross/km" value={analysis.grossPerKm !== undefined ? `₪${analysis.grossPerKm.toFixed(2)}` : "-"} />
            <Metric label="Rating" value={`${analysis.rating}/10`} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-200">Insights</p>
            {analysis.insights.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">אין מספיק נתונים ליצירת תובנות.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {analysis.insights.map((insight) => (
                  <li key={insight}>- {insight}</li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <button
          type="button"
          onClick={() => setShowDebug((prev) => !prev)}
          className="text-sm font-bold text-slate-200"
        >
          {showDebug ? "הסתר טקסט OCR גולמי" : "הצג טקסט OCR גולמי (Debug)"}
        </button>
        {showDebug ? (
          rawTexts.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">אין עדיין טקסט OCR להצגה.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {rawTexts.map((text, index) => (
                <details key={`${index}-${text.length}`} className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                  <summary className="cursor-pointer text-xs text-slate-300">תמונה {index + 1}</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-slate-400">{text}</pre>
                </details>
              ))}
            </div>
          )
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function toOptionalNumber(value: string): number | undefined {
  const parsed = toNumber(value);
  if (parsed === null) return undefined;
  return parsed;
}

function toNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number): string {
  return `₪${value.toFixed(2)}`;
}

function formatMaybeCurrency(value: number | undefined): string {
  return value !== undefined ? `₪${value.toFixed(2)}` : "-";
}

function formatDuration(hours: number | undefined): string {
  if (hours === undefined) return "-";
  return `${hours.toFixed(2)}h`;
}

function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
