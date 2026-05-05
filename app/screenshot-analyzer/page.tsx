"use client";

import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import {
  buildShiftAnalysis,
  dedupeTasks,
  detectShiftDateFromText,
  parseOcrShiftSummary,
  parseTasksFromOcrText,
  type ParsedOcrShiftSummary,
  summarizeSessions,
  summarizeTasksForOcrPreview,
  validateSessions
} from "@/features/screenshot-analyzer/analysis";
import { readShiftAnalysisByDate, saveShiftAnalysisByDate } from "@/lib/storage";
import EditableOcrTable from "@/src/components/ocr/EditableOcrTable";
import { getTodayDateInput } from "@/src/lib/dateTime";
import type { DeliveryTask, ShiftAnalysis, ShiftSession } from "@/types/models";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type OcrProgress = {
  imageIndex: number;
  percent: number;
};

type PendingOcrBatch = {
  tasks: DeliveryTask[];
  rawTexts: string[];
  detectedDate?: string;
};

const DEFAULT_COST_PER_KM = 0.7;

export default function ScreenshotAnalyzerPage() {
  const { startShift, updateActiveShiftSnapshot } = useAppData();
  const today = getTodayDateInput();
  const [shiftDate, setShiftDate] = useState(today);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("date");
      if (fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl)) {
        setShiftDate(fromUrl);
      }
    } catch {
      // ignore invalid URL access
    }
  }, []);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [rawTexts, setRawTexts] = useState<string[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [sessions, setSessions] = useState<ShiftSession[]>([]);
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [actualDrivenKm, setActualDrivenKm] = useState<string>("");
  const [costPerKm, setCostPerKm] = useState<string>(String(DEFAULT_COST_PER_KM));
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
  const [confirmedAnalysis, setConfirmedAnalysis] = useState<ShiftAnalysis | null>(null);
  const [pendingBatch, setPendingBatch] = useState<PendingOcrBatch | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<ParsedOcrShiftSummary>({});

  useEffect(() => {
    setError(null);
    try {
      const snapshot = readShiftAnalysisByDate(shiftDate);
      if (!snapshot) {
        setTasks([]);
        setSessions([]);
        setRawTexts([]);
        setSuggestedDate(null);
        setActualDrivenKm("");
        setCostPerKm(String(DEFAULT_COST_PER_KM));
        setCreatedAt(new Date().toISOString());
        setConfirmedAnalysis(null);
        return;
      }
      setTasks(snapshot.tasks ?? []);
      setSessions(snapshot.sessions ?? []);
      setRawTexts(snapshot.rawTexts ?? []);
      setSuggestedDate(snapshot.ocrDetectedDate ?? null);
      setActualDrivenKm(snapshot.actualDrivenKm !== undefined ? String(snapshot.actualDrivenKm) : "");
      setCostPerKm(String(snapshot.costPerKm ?? DEFAULT_COST_PER_KM));
      setCreatedAt(snapshot.createdAt);
      setConfirmedAnalysis(snapshot.analysis ?? null);
    } catch {
      setError("שגיאה בטעינת משמרת שמורה. נסו לבחור תאריך אחר.");
      setTasks([]);
      setSessions([]);
      setRawTexts([]);
      setConfirmedAnalysis(null);
    }
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

  const sessionIssues = useMemo(() => validateSessions(sessions), [sessions]);
  const sessionSummary = useMemo(() => summarizeSessions(sessions), [sessions]);
  const ocrTasksSummary = useMemo(() => summarizeTasksForOcrPreview(tasks), [tasks]);

  useEffect(() => {
    if (tasks.length === 0 || !confirmedAnalysis) return;
    saveShiftAnalysisByDate({
      shiftDate,
      sessions,
      tasks,
      rawTexts,
      ocrDetectedDate: suggestedDate ?? undefined,
      actualDrivenKm: actualDrivenKmValue,
      costPerKm: costPerKmValue,
      analysis: confirmedAnalysis,
      createdAt,
      updatedAt: new Date().toISOString()
    });
  }, [actualDrivenKmValue, confirmedAnalysis, costPerKmValue, createdAt, rawTexts, sessions, shiftDate, suggestedDate, tasks]);

  useEffect(() => {
    setConfirmedAnalysis(null);
  }, [tasks, actualDrivenKm, costPerKm, sessions]);

  useEffect(() => {
    if (tasks.length === 0) return;
    const gross = tasks.reduce((sum, task) => sum + task.amountIls, 0);
    const deliveries = tasks.reduce((sum, task) => sum + Math.max(1, task.deliveriesCount), 0);
    const workingHours = sessionSummary.activeWorkHours;
    setSummaryDraft((prev) => ({
      totalEarnings: prev.totalEarnings ?? gross,
      numberOfDeliveries: prev.numberOfDeliveries ?? deliveries,
      workingHours: prev.workingHours ?? workingHours
    }));
  }, [sessionSummary.activeWorkHours, tasks]);

  const onPickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const nextItems: UploadItem[] = Array.from(fileList)
      .filter((file) => isLikelyImageFile(file))
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

  const handleDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) return;
    const asUploadItems: UploadItem[] = files
      .filter((file) => isLikelyImageFile(file))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));
    if (asUploadItems.length === 0) {
      setError("לא נמצאו קבצי תמונה תקינים.");
      return;
    }
    setError(null);
    setUploads((prev) => [...prev, ...asUploadItems]);
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
      const collectedSummaries: ParsedOcrShiftSummary[] = [];
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
        collectedSummaries.push(parseOcrShiftSummary(text));
        detectedDate = detectedDate ?? detectShiftDateFromText(text);
        collectedTasks.push(...parseTasksFromOcrText(text, imageIndex));
      }
      const dedupedIncomingTasks = dedupeTasks(collectedTasks);

      if (dedupedIncomingTasks.length === 0) {
        setError("לא זוהו שורות משלוחים. נסה תמונות חדות יותר.");
        return;
      }
      const existingShift = readShiftAnalysisByDate(shiftDate);
      const hasExistingShift = Boolean(existingShift && existingShift.tasks.length > 0);

      if (hasExistingShift) {
        setPendingBatch({
          tasks: dedupedIncomingTasks,
          rawTexts: collectedTexts,
          detectedDate
        });
      } else {
        setTasks(dedupeTasks([...tasks, ...dedupedIncomingTasks]));
        setRawTexts((prev) => [...prev, ...collectedTexts]);
        if (detectedDate) setSuggestedDate(detectedDate);
      }

      const detectedEarnings = collectedSummaries.find((s) => s.totalEarnings !== undefined)?.totalEarnings;
      const detectedDeliveries = collectedSummaries.find((s) => s.numberOfDeliveries !== undefined)?.numberOfDeliveries;
      const detectedWorkingHours = collectedSummaries.find((s) => s.workingHours !== undefined)?.workingHours;
      setSummaryDraft((prev) => ({
        totalEarnings: detectedEarnings ?? prev.totalEarnings,
        numberOfDeliveries: detectedDeliveries ?? prev.numberOfDeliveries,
        workingHours: detectedWorkingHours ?? prev.workingHours
      }));

      setUploads([]);
    } catch (ocrError: unknown) {
      console.error(ocrError);
      const msg = ocrError instanceof Error ? ocrError.message : String(ocrError);
      const lower = msg.toLowerCase();
      if (
        lower.includes("failed to fetch") ||
        lower.includes("dynamically imported") ||
        lower.includes("cannot find module") ||
        lower.includes("loading chunk") ||
        lower.includes("chunkloaderror")
      ) {
        setError(
          "לא ניתן לטעון את מנוע ה-OCR (tesseract). בדקו שהאפליקציה נבנתה והותקנו כל החבילות (npm install), או נסו רענון מלא."
        );
      } else {
        setError("שגיאה בזמן OCR. נסה שוב עם תמונות אחרות.");
      }
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

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const addManualTaskRow = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: `manual-${crypto.randomUUID()}`,
        restaurant: "",
        time: "",
        distanceKm: undefined,
        amountIls: 0,
        deliveriesCount: 1,
        sourceImageIndex: -1,
        source: "manual"
      }
    ]);
  };

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startDateTime: `${shiftDate}T13:00:00`,
        endDateTime: `${shiftDate}T15:00:00`,
        isOvernight: false
      }
    ]);
  };

  const removeSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const updateSession = (id: string, patch: Partial<ShiftSession>) => {
    setSessions((prev) => prev.map((session) => (session.id === id ? { ...session, ...patch } : session)));
  };

  const calculateShift = () => {
    if (tasks.length === 0) {
      setError("אין שורות לחישוב. הוסף לפחות שורה אחת.");
      return;
    }
    const cleanedTasks = tasks.filter((task) => (task.restaurant ?? "").trim() && task.amountIls > 0);
    if (cleanedTasks.length === 0) {
      setError("נדרשים מסעדה וסכום גדול מ-0 לפחות בשורה אחת.");
      return;
    }
    setError(null);
    const next = buildShiftAnalysis(cleanedTasks, actualDrivenKmValue, costPerKmValue, sessions);
    setTasks(cleanedTasks);
    setConfirmedAnalysis(next);
  };

  const resolvePendingBatch = (mode: "merge" | "replace" | "cancel") => {
    if (!pendingBatch) return;
    if (mode === "cancel") {
      setPendingBatch(null);
      return;
    }
    if (mode === "merge") {
      setTasks((prev) => dedupeTasks([...prev, ...pendingBatch.tasks]));
      setRawTexts((prev) => [...prev, ...pendingBatch.rawTexts]);
    } else {
      setTasks(dedupeTasks([...pendingBatch.tasks]));
      setRawTexts([...pendingBatch.rawTexts]);
      setConfirmedAnalysis(null);
    }
    if (pendingBatch.detectedDate) setSuggestedDate(pendingBatch.detectedDate);
    setPendingBatch(null);
  };

  const applySummaryToActiveShift = () => {
    startShift();
    const workingHours = summaryDraft.workingHours;
    const totalEarnings = summaryDraft.totalEarnings;
    const sessionsFromSummary =
      typeof workingHours === "number" && workingHours > 0
        ? [
            {
              id: crypto.randomUUID(),
              startTime: hoursAgoToTimeString(workingHours),
              endTime: currentTimeString(),
              isNextDay: false
            }
          ]
        : undefined;
    updateActiveShiftSnapshot({
      totalIncome: totalEarnings,
      totalKm: actualDrivenKmValue,
      sessions: sessionsFromSummary
    });
  };

  return (
    <main className="space-y-4">
      <ScreenHeader
        title="ניתוח צילומי מסך"
        subtitle="העלאה רטרואקטיבית של כמה צילומים, תיקון ידני לפני שמירה, והיסטוריה לפי תאריך משמרת"
      />

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
        <label className="mb-2 block text-sm font-bold text-slate-200">העלאת צילומים (כמה בבת אחת)</label>
        <div
          onDrop={handleDropFiles}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`rounded-xl border-2 border-dashed p-4 ${isDragging ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-950"}`}
        >
          <p className="text-xs text-slate-300">גרור ושחרר תמונות לכאן או בחר קבצים ידנית</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="mt-3 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-3 file:text-sm file:font-black file:text-slate-950"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {uploads.length > 0 ? `${uploads.length} תמונות נבחרו` : "לא נבחרו תמונות עדיין"}
        </p>

        {uploads.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">אפשר לבחור כמה תמונות יחד, ואז להסיר מה שלא צריך.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {uploads.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: previews are not supported reliably by next/image */}
                <img src={item.previewUrl} alt={item.file.name} className="h-24 w-full object-cover" />
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
          className="mt-4 min-h-[3.5rem] w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 disabled:opacity-60"
        >
          {isAnalyzing ? "מנתח צילומים..." : "נתח צילומים"}
        </button>

        {progress ? (
          <p className="mt-2 text-xs text-slate-300">
            תמונה {progress.imageIndex + 1} מתוך {uploads.length}: {progress.percent}%
          </p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        {error ? <p className="mt-1 text-xs text-slate-400">אפשר להמשיך בהזנה ידנית גם אם ה-OCR נכשל.</p> : null}
        {pendingBatch ? (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
            <p className="font-bold">יש כבר משמרת בתאריך הזה. איך להמשיך?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => resolvePendingBatch("merge")}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-2 font-bold text-emerald-100"
              >
                מיזוג עם קיים
              </button>
              <button
                type="button"
                onClick={() => resolvePendingBatch("replace")}
                className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2 py-2 font-bold text-amber-100"
              >
                החלף קיים
              </button>
              <button
                type="button"
                onClick={() => resolvePendingBatch("cancel")}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 font-bold text-slate-100"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {tasks.length > 0 ? (
        <>
          <section className="rounded-2xl border border-sky-500/30 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-100">מה שחולץ מהצילומים</p>
            <p className="mt-1 text-xs text-slate-400">בדקו ותקנו בטבלה למטה לפני חישוב ושמירה להיסטוריה.</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-200">
              {ocrTasksSummary.timeRangeLabel ? (
                <li>
                  טווח שעות במשימות (משוער): <strong>{ocrTasksSummary.timeRangeLabel}</strong>
                </li>
              ) : (
                <li className="text-slate-400">לא זוהו שעות ברורות — ניתן להזין ידנית בטבלה.</li>
              )}
              <li>
                סכום הכנסות (משימות): <strong>₪{ocrTasksSummary.grossSum.toFixed(2)}</strong>
              </li>
              <li>
                משימות: <strong>{ocrTasksSummary.taskCount}</strong> · משלוחים (כולל כפולים):{" "}
                <strong>{ocrTasksSummary.deliveryCount}</strong>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-200">נתונים שחולצו (ניתנים לעריכה)</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={summaryDraft.totalEarnings ?? ""}
                onChange={(e) => setSummaryDraft((prev) => ({ ...prev, totalEarnings: toOptionalNumber(e.target.value) }))}
                placeholder="סה״כ הכנסות (₪)"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <input
                value={summaryDraft.numberOfDeliveries ?? ""}
                onChange={(e) =>
                  setSummaryDraft((prev) => ({
                    ...prev,
                    numberOfDeliveries: toOptionalNumber(e.target.value) !== undefined ? Math.max(0, Math.round(toOptionalNumber(e.target.value)!)) : undefined
                  }))
                }
                placeholder="מספר משלוחים"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <input
                value={summaryDraft.workingHours ?? ""}
                onChange={(e) => setSummaryDraft((prev) => ({ ...prev, workingHours: toOptionalNumber(e.target.value) }))}
                placeholder="זמן עבודה (שעות)"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={applySummaryToActiveShift}
              className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100"
            >
              מלא אוטומטית למשמרת פעילה
            </button>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-200">מקטעי עבודה</p>
              <button
                type="button"
                onClick={addSession}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200"
              >
                הוסף מקטע עבודה
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400">לא הוגדרו מקטעים עדיין. ניתן לחשב לפי זמני משלוחים בלבד, אבל עדיף להגדיר מקטעים.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {sessions.map((session, index) => (
                  <div key={session.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs font-bold text-slate-300">מקטע {index + 1}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">תחילת מקטע</label>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalValue(session.startDateTime)}
                          onChange={(e) => updateSession(session.id, { startDateTime: fromDateTimeLocalValue(e.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">סיום מקטע</label>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalValue(session.endDateTime)}
                          onChange={(e) => updateSession(session.id, { endDateTime: fromDateTimeLocalValue(e.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={session.isOvernight || false}
                          onChange={(e) => updateSession(session.id, { isOvernight: e.target.checked })}
                        />
                        מסתיים ביום הבא
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSession(session.id)}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-100"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <p className="rounded-lg bg-slate-950 px-2 py-2 text-slate-300">מספר מקטעים: {sessions.length}</p>
              <p className="rounded-lg bg-slate-950 px-2 py-2 text-slate-300">זמן עבודה נטו: {formatDuration(sessionSummary.activeWorkHours)}</p>
              <p className="rounded-lg bg-slate-950 px-2 py-2 text-slate-300">זמן הפסקות: {formatDuration(sessionSummary.breakHours)}</p>
            </div>

            {sessionIssues.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">
                {sessionIssues.map((issue) => (
                  <p key={issue}>- {issue}</p>
                ))}
              </div>
            ) : null}
          </section>

          <EditableOcrTable
            tasks={tasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddManualTask={addManualTaskRow}
          />
          <button
            type="button"
            onClick={calculateShift}
            disabled={tasks.length === 0}
            className="min-h-[3.5rem] w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 disabled:opacity-60"
          >
            חשב משמרת ושמור לפי התאריך
          </button>

          {confirmedAnalysis ? (
            <>
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
                <Metric label="הכנסה ברוטו" value={formatCurrency(confirmedAnalysis.grossIncome)} />
                <Metric label="עלות רכב" value={formatCurrency(confirmedAnalysis.vehicleCost)} />
                <Metric label="רווח נטו" value={formatCurrency(confirmedAnalysis.netIncome)} />
                <Metric label="נטו לשעה" value={formatMaybeCurrency(confirmedAnalysis.netPerHour)} />
                <Metric label="נטו לק״מ" value={confirmedAnalysis.netPerKm !== undefined ? `₪${confirmedAnalysis.netPerKm.toFixed(2)}` : "-"} />
                <Metric label="ק״מ אמיתי" value={actualDrivenKmValue !== undefined ? String(actualDrivenKmValue) : "-"} />
                <Metric label="ברוטו לשעה" value={formatMaybeCurrency(confirmedAnalysis.grossPerHour)} />
                <Metric label="ברוטו לק״מ" value={confirmedAnalysis.grossPerKm !== undefined ? `₪${confirmedAnalysis.grossPerKm.toFixed(2)}` : "-"} />
                <Metric label="זמן עבודה נטו" value={formatDuration(confirmedAnalysis.activeHours)} />
                <Metric label="זמן הפסקות" value={formatDuration(confirmedAnalysis.breakHours)} />
                <Metric label="דירוג" value={`${confirmedAnalysis.rating}/10`} />
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-bold text-slate-200">תובנות</p>
                {confirmedAnalysis.insights.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">אין מספיק נתונים ליצירת תובנות.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {confirmedAnalysis.insights.map((insight) => (
                      <li key={insight}>- {insight}</li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
              ערוך את הטבלה ואז לחץ על <strong>חשב משמרת</strong> כדי לראות תוצאות.
            </section>
          )}
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <button
          type="button"
          onClick={() => setShowDebug((prev) => !prev)}
          className="text-sm font-bold text-slate-200"
        >
          {showDebug ? "הסתר טקסט גולמי מהסריקה" : "הצג טקסט גולמי מהסריקה (למתקדמים)"}
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

function isLikelyImageFile(file: File): boolean {
  if (file.type?.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].some((ext) =>
    lower.endsWith(ext)
  );
}

function toDateTimeLocalValue(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function fromDateTimeLocalValue(value: string): string {
  if (!value) return "";
  return `${value}:00`;
}

function currentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function hoursAgoToTimeString(hours: number): string {
  const now = new Date();
  const before = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return `${String(before.getHours()).padStart(2, "0")}:${String(before.getMinutes()).padStart(2, "0")}`;
}
