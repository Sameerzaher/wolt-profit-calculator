"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackupCard from "@/components/BackupCard";
import CalculatorForm from "@/components/CalculatorForm";
import DailySummary from "@/components/DailySummary";
import HistoryList from "@/components/HistoryList";
import InstallHint from "@/components/InstallHint";
import ResultCard from "@/components/ResultCard";
import ThemeToggle from "@/components/ThemeToggle";
import { formatDateTime } from "@/lib/date";
import { hapticLight } from "@/lib/haptics";
import { parseBackupFile } from "@/lib/backup";
import { evaluateCourierOrder } from "@/lib/evaluateOrder";
import {
  addDelivery,
  applyValidatedBackup,
  clearAllDeliveries,
  deleteDeliveryById,
  exportBackupPayload,
  loadDailyPrefs,
  loadDeliveries,
  loadTheme,
  saveDailyPrefs,
  saveTheme,
  updateDeliveryById
} from "@/lib/storage";
import type { CalculatorInput, DailySummaryPrefs, SavedDelivery } from "@/lib/types";

const KEEP_LAST_KEY = "wolt_keep_last_after_save_v1";

type HistoryFilter = "today" | "all";

const defaultInput: CalculatorInput = {
  price: 30,
  distanceKm: 3.5,
  estimatedMinutes: null,
  cashTip: 0,
  isDoubleOrder: false,
  leavesHotZone: false
};

export default function HomePage() {
  const [input, setInput] = useState<CalculatorInput>(defaultInput);
  const [inputIssues, setInputIssues] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<SavedDelivery[]>([]);
  const [dailyPrefs, setDailyPrefs] = useState<DailySummaryPrefs>({
    hoursWorked: 0,
    cashTipsNis: 0,
    extraCashTipsNis: 0,
    tipsInputMode: "from_history"
  });
  const [filter, setFilter] = useState<HistoryFilter>("today");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [keepLastAfterSave, setKeepLastAfterSave] = useState(false);

  const dailySaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDeliveries(loadDeliveries());
    setDailyPrefs(loadDailyPrefs());
    const initialTheme = loadTheme();
    setIsDark(initialTheme === "dark");
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    try {
      setKeepLastAfterSave(localStorage.getItem(KEEP_LAST_KEY) === "1");
    } catch {
      setKeepLastAfterSave(false);
    }
  }, []);

  useEffect(() => {
    if (dailySaveTimer.current) clearTimeout(dailySaveTimer.current);
    dailySaveTimer.current = setTimeout(() => saveDailyPrefs(dailyPrefs), 400);
    return () => {
      if (dailySaveTimer.current) clearTimeout(dailySaveTimer.current);
    };
  }, [dailyPrefs]);

  const result = useMemo(() => {
    if (inputIssues.length > 0) return null;
    return evaluateCourierOrder(input);
  }, [input, inputIssues]);

  const setKeepLastPreference = useCallback((next: boolean) => {
    setKeepLastAfterSave(next);
    try {
      localStorage.setItem(KEEP_LAST_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const resetFormToDefaults = useCallback(() => {
    setEditingId(null);
    setEditingCreatedAt(null);
    setInput(defaultInput);
    setInputIssues([]);
  }, []);

  const handleSave = () => {
    if (inputIssues.length > 0) {
      window.alert("תקנו את השדות לפני השמירה.");
      return;
    }
    if (!result) {
      window.alert("אין מה לשמור — הקלט לא תקין.");
      return;
    }

    hapticLight();

    const baseEntry: SavedDelivery = {
      ...input,
      ...result,
      id: editingId ?? crypto.randomUUID(),
      createdAt: editingCreatedAt ?? new Date().toISOString()
    };
    const updated = editingId ? updateDeliveryById(editingId, baseEntry) : addDelivery(baseEntry);
    setDeliveries(updated);

    setEditingId(null);
    setEditingCreatedAt(null);

    if (!keepLastAfterSave) {
      setInput(defaultInput);
    }
    setInputIssues([]);
  };

  const handleDelete = (id: string) => {
    setDeliveries(deleteDeliveryById(id));
  };

  const handleClearAll = () => {
    const confirmed = window.confirm("למחוק את כל הבדיקות השמורות? לא ניתן לבטל.");
    if (!confirmed) return;
    setDeliveries(clearAllDeliveries());
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    saveTheme(next ? "dark" : "light");
  };

  const startEdit = (delivery: SavedDelivery) => {
    setInput({
      price: delivery.price,
      distanceKm: delivery.distanceKm,
      estimatedMinutes: delivery.estimatedMinutes,
      cashTip: delivery.cashTip,
      isDoubleOrder: delivery.isDoubleOrder,
      leavesHotZone: delivery.leavesHotZone
    });
    setInputIssues([]);
    setEditingId(delivery.id);
    setEditingCreatedAt(delivery.createdAt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicateLast = useCallback(() => {
    const latest = deliveries[0];
    if (!latest) return;
    setInput({
      price: latest.price,
      distanceKm: latest.distanceKm,
      estimatedMinutes: latest.estimatedMinutes,
      cashTip: latest.cashTip,
      isDoubleOrder: latest.isDoubleOrder,
      leavesHotZone: latest.leavesHotZone
    });
    setInputIssues([]);
    setEditingId(null);
    setEditingCreatedAt(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [deliveries]);

  const handleExportBackup = () => {
    try {
      const payload = exportBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wolt-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("ייצוא נכשל.");
    }
  };

  const handleImportBackup = async (file: File) => {
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      window.alert("לא ניתן לקרוא את הקובץ.");
      return;
    }

    const res = parseBackupFile(parsed);
    if (!res.ok) {
      window.alert(res.error);
      return;
    }

    const hasData = deliveries.length > 0;
    if (hasData) {
      const ok = window.confirm("הייבוא יחליף את הבדיקות השמורות במכשיר. להמשיך?");
      if (!ok) return;
    }

    try {
      const applied = applyValidatedBackup(res.payload);
      setDeliveries(applied.deliveries);
      setEditingId(null);
      setEditingCreatedAt(null);
      setInput(defaultInput);
      setInputIssues([]);
      window.alert("הגיבוי יובא בהצלחה.");
    } catch {
      window.alert("לא ניתן לשמור נתונים אחרי הייבוא.");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-6 px-safe pb-44 pt-4 pt-safe sm:space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">שליח/ה</p>
          <h1 className="mt-0.5 text-2xl font-black leading-tight tracking-tight text-text sm:text-[1.65rem]">
            עוזר החלטות
          </h1>
          <p className="mt-2 text-sm leading-snug text-muted sm:text-base">
            קבלה או דילוג מהיר בטלפון — מחיר, מרחק, זמן וטיפים.
          </p>
        </div>
        <div className="shrink-0 sm:pt-1">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      <InstallHint />

      {editingId && editingCreatedAt && (
        <section className="rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
          עורכים בדיקה מ־<span className="tabular-nums">{formatDateTime(editingCreatedAt)}</span>
        </section>
      )}

      <CalculatorForm value={input} onChange={setInput} onValidityChange={setInputIssues} />
      <ResultCard result={result} inputIssues={inputIssues} />
      <HistoryList
        deliveries={deliveries}
        filter={filter}
        onFilterChange={setFilter}
        onDuplicateLast={duplicateLast}
        onEdit={startEdit}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />
      <DailySummary deliveries={deliveries} prefs={dailyPrefs} onPrefsChange={setDailyPrefs} />
      <BackupCard onExport={handleExportBackup} onImport={handleImportBackup} />

      <div className="fixed bottom-0 left-0 right-0 z-20 px-safe">
        <div className="mx-auto max-w-lg rounded-t-3xl border border-b-0 border-border bg-card/92 shadow-dock backdrop-blur-xl dark:border-slate-600/60 dark:bg-card/95 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
          <div className="px-4 pb-safe pt-4">
            {editingId && (
              <button
                type="button"
                onClick={resetFormToDefaults}
                className="mb-3 w-full rounded-xl border border-border bg-accent/50 py-3.5 text-base font-semibold text-text transition active:scale-[0.99] dark:bg-white/5"
              >
                ביטול עריכה
              </button>
            )}

            <div className="mb-3 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="min-h-[3.5rem] flex-1 rounded-xl bg-primary py-3.5 text-lg font-black text-white shadow-md shadow-primary/30 transition active:scale-[0.99] active:shadow-sm"
              >
                {editingId ? "עדכן בדיקה" : "שמור בדיקה"}
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  resetFormToDefaults();
                }}
                className="min-h-[3.5rem] w-[34%] rounded-xl border-2 border-border bg-card py-3.5 text-base font-black shadow-sm transition active:scale-[0.99] dark:bg-card/80"
              >
                איפוס
              </button>
            </div>

            <label className="flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-xl py-1.5 text-base font-semibold text-text">
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/30"
                checked={keepLastAfterSave}
                onChange={(e) => setKeepLastPreference(e.target.checked)}
              />
              להשאיר ערכים אחרי שמירה
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
