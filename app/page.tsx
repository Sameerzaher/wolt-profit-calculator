"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackupCard from "@/components/BackupCard";
import CalculatorForm from "@/components/CalculatorForm";
import DailySummary from "@/components/DailySummary";
import HistoryList from "@/components/HistoryList";
import InstallHint from "@/components/InstallHint";
import ResultCard from "@/components/ResultCard";
import SettingsCard from "@/components/SettingsCard";
import ThemeToggle from "@/components/ThemeToggle";
import { formatDateTime } from "@/lib/date";
import { hapticLight } from "@/lib/haptics";
import { parseBackupFile } from "@/lib/backup";
import { calculateDelivery, defaultScoringSettings } from "@/lib/scoring";
import {
  addDelivery,
  applyValidatedBackup,
  clearAllDeliveries,
  deleteDeliveryById,
  exportBackupPayload,
  loadDeliveries,
  loadScoringSettings,
  loadTheme,
  saveScoringSettings,
  saveTheme,
  updateDeliveryById
} from "@/lib/storage";
import type { CalculatorInput, SavedDelivery, ScoringSettings } from "@/lib/types";

const KEEP_LAST_KEY = "wolt_keep_last_after_save_v1";

type HistoryFilter = "today" | "all";

const defaultInput: CalculatorInput = {
  payout: 30,
  minutes: 20,
  km: 8,
  isPeakHour: false,
  inHotZone: true,
  nextOrderChance: "medium"
};

export default function HomePage() {
  const [input, setInput] = useState<CalculatorInput>(defaultInput);
  const [inputIssues, setInputIssues] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<SavedDelivery[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("today");
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [settings, setSettings] = useState<ScoringSettings>(defaultScoringSettings);
  const [keepLastAfterSave, setKeepLastAfterSave] = useState(false);

  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDeliveries(loadDeliveries());
    setSettings(loadScoringSettings());
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
    if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = setTimeout(() => saveScoringSettings(settings), 400);
    return () => {
      if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current);
    };
  }, [settings]);

  const result = useMemo(() => {
    if (inputIssues.length > 0) return null;
    try {
      return calculateDelivery(input, settings);
    } catch {
      return null;
    }
  }, [input, settings, inputIssues]);

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
      window.alert("יש לתקן את השדות לפני שמירה.");
      return;
    }
    if (!result) {
      window.alert("לא ניתן לשמור — אין חישוב תקף.");
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
    const confirmed = window.confirm("למחוק את כל ההיסטוריה? לא ניתן לבטל פעולה זו.");
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
      payout: delivery.payout,
      minutes: delivery.minutes,
      km: delivery.km,
      isPeakHour: delivery.isPeakHour,
      inHotZone: delivery.inHotZone,
      nextOrderChance: delivery.nextOrderChance
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
      payout: latest.payout,
      minutes: latest.minutes,
      km: latest.km,
      isPeakHour: latest.isPeakHour,
      inHotZone: latest.inHotZone,
      nextOrderChance: latest.nextOrderChance
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
      window.alert("ייצוא הנתונים נכשל.");
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
      const ok = window.confirm("הייבוא יחליף את ההיסטוריה וההגדרות במכשיר. להמשיך?");
      if (!ok) return;
    }

    try {
      const applied = applyValidatedBackup(res.payload);
      setDeliveries(applied.deliveries);
      setSettings(applied.settings);
      setEditingId(null);
      setEditingCreatedAt(null);
      setInput(defaultInput);
      setInputIssues([]);
      window.alert("הגיבוי יובא בהצלחה.");
   } catch {
      window.alert("שגיאה בשמירת הנתונים לאחר הייבוא.");
    }
  };

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-40 pt-4">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black leading-tight">Wolt Delivery Calculator</h1>
          <p className="mt-1 text-base text-muted">כלי אישי מהיר להחלטה על משלוח</p>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </header>

      <InstallHint />

      <section className="inline-flex rounded-xl border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("quick")}
          className={`rounded-lg px-4 py-2.5 text-base font-semibold ${mode === "quick" ? "bg-primary/15 text-primary" : "text-muted"}`}
        >
          מצב מהיר
        </button>
        <button
          type="button"
          onClick={() => setMode("advanced")}
          className={`rounded-lg px-4 py-2.5 text-base font-semibold ${mode === "advanced" ? "bg-primary/15 text-primary" : "text-muted"}`}
        >
          מצב מתקדם
        </button>
      </section>

      {editingId && editingCreatedAt && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-base font-semibold">
          מצב עריכה: משלוח מ־{formatDateTime(editingCreatedAt)}
        </section>
      )}

      <DailySummary deliveries={deliveries} />
      <CalculatorForm value={input} onChange={setInput} onValidityChange={setInputIssues} mode={mode} />
      {mode === "advanced" && (
        <SettingsCard
          settings={settings}
          onChange={setSettings}
          onReset={() => setSettings(defaultScoringSettings)}
        />
      )}
      <BackupCard onExport={handleExportBackup} onImport={handleImportBackup} />
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

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-bg/95 p-3 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        {editingId && (
          <button
            type="button"
            onClick={resetFormToDefaults}
            className="mb-2 w-full rounded-xl border border-border px-4 py-3 text-base font-medium"
          >
            בטל עריכה
          </button>
        )}

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              resetFormToDefaults();
            }}
            className="w-[36%] rounded-xl border-2 border-border py-4 text-base font-bold"
          >
            נקה
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-[64%] rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-lg shadow-primary/25 transition active:scale-[0.99]"
          >
            {editingId ? "עדכן" : "שמור משלוח"}
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-base font-medium text-text">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-border"
            checked={keepLastAfterSave}
            onChange={(e) => setKeepLastPreference(e.target.checked)}
          />
          להשאיר ערכים אחרי שמירה
        </label>
      </div>
    </main>
  );
}
