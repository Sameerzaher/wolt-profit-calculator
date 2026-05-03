"use client";

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { listAllShiftAnalyses } from "@/lib/storage";
import type { ScreenshotAnalysisSnapshot } from "@/types/models";

const DEFAULT_WEEKLY_GOAL = 2900;
const WEEKLY_GOAL_STORAGE_KEY = "woltcalc_weekly_goal_ils";

export default function MonthlyPageContent() {
  const [analyses, setAnalyses] = useState<ScreenshotAnalysisSnapshot[]>([]);
  const [month, setMonth] = useState(getCurrentMonthInput());
  const [weeklyGoal, setWeeklyGoal] = useState(String(DEFAULT_WEEKLY_GOAL));
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      setAnalyses(listAllShiftAnalyses());
    } catch {
      setAnalyses([]);
    }
    try {
      setWeeklyGoal(readWeeklyGoalFromStorage());
    } catch {
      setWeeklyGoal(String(DEFAULT_WEEKLY_GOAL));
    }
    setStorageReady(true);
  }, []);

  const aggregatable = analyses.filter(isAggregatableSnapshot);
  const monthItems = aggregatable.filter((item) => item.shiftDate.startsWith(month));
  const monthSummary = summarize(monthItems);
  const weekSummary = summarize(getCurrentWeekItems(aggregatable));
  const weeklyGoalValue = Number(weeklyGoal) || DEFAULT_WEEKLY_GOAL;
  const weekProgress = Math.min(100, (weekSummary.totalGross / weeklyGoalValue) * 100);
  const weekRemaining = Math.max(0, weeklyGoalValue - weekSummary.totalGross);

  if (!storageReady) {
    return (
      <main className="space-y-4">
        <ScreenHeader title="סיכום חודשי" subtitle="מעקב ביצועי משמרות מצילומי מסך" />
        <p className="text-sm text-slate-400">טוען נתונים...</p>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <ScreenHeader title="סיכום חודשי" subtitle="מעקב ביצועי משמרות מצילומי מסך" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <label className="mb-2 block text-sm font-bold text-slate-200">בחירת חודש</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
        />
      </section>

      {aggregatable.length === 0 ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
          אין משמרות מנותחות שמורות. צלמו משמרת ב&quot;ניתוח צילומי מסך&quot; כדי לראות כאן סיכומים.
        </section>
      ) : null}

      {aggregatable.length > 0 ? (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-100">סיכום החודש הנבחר</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="סה״כ ברוטו" value={money(monthSummary.totalGross)} />
              <Metric label="סה״כ עלות רכב" value={money(monthSummary.totalVehicleCost)} />
              <Metric label="סה״כ נטו" value={money(monthSummary.totalNet)} />
              <Metric label="מספר משמרות" value={String(monthSummary.shiftCount)} />
              <Metric label="סה״כ שעות עבודה" value={num(monthSummary.totalHours)} />
              <Metric label="סה״כ ק״מ" value={num(monthSummary.totalKm)} />
              <Metric label="ממוצע נטו לשעה" value={monthSummary.avgNetPerHour ? money(monthSummary.avgNetPerHour) : "-"} />
              <Metric label="ממוצע ברוטו לק״מ" value={monthSummary.avgPerKm ? money(monthSummary.avgPerKm) : "-"} />
              <Metric label="ממוצע ברוטו למשמרת" value={money(monthSummary.avgGrossPerShift)} />
              <Metric label="ממוצע נטו למשמרת" value={money(monthSummary.avgNetPerShift)} />
              <Metric label="ממוצע שעות למשמרת" value={num(monthSummary.avgHoursPerShift)} />
              <Metric label="המשמרת החזקה (ברוטו)" value={monthSummary.bestShift} />
              <Metric label="המשמרת החלשה (ברוטו)" value={monthSummary.worstShift} />
            </div>
          </section>

          <section className="rounded-2xl border border-sky-500/25 bg-slate-900 p-4">
            <p className="text-sm font-bold text-slate-100">סיכום השבוע הנוכחי (ראשון–שבת)</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="סה״כ ברוטו" value={money(weekSummary.totalGross)} />
              <Metric label="סה״כ עלות רכב" value={money(weekSummary.totalVehicleCost)} />
              <Metric label="סה״כ נטו" value={money(weekSummary.totalNet)} />
              <Metric label="מספר משמרות" value={String(weekSummary.shiftCount)} />
              <Metric label="סה״כ שעות" value={num(weekSummary.totalHours)} />
              <Metric label="סה״כ ק״מ" value={num(weekSummary.totalKm)} />
              <Metric label="ממוצע נטו לשעה" value={weekSummary.avgNetPerHour ? money(weekSummary.avgNetPerHour) : "-"} />
              <Metric label="ממוצע ברוטו למשמרת" value={money(weekSummary.avgGrossPerShift)} />
              <Metric label="ממוצע נטו למשמרת" value={money(weekSummary.avgNetPerShift)} />
              <Metric label="המשמרת החזקה" value={weekSummary.bestShift} />
              <Metric label="המשמרת החלשה" value={weekSummary.worstShift} />
            </div>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4">
        <p className="text-sm font-bold text-slate-100">יעד שבועי (ברוטו)</p>
        <p className="mt-1 text-xs text-slate-400">ברירת מחדל ₪2,900 — ניתן לערוך. ההתקדמות מחושבת מסה״כ ברוטו בשבוע הנוכחי.</p>
        <div className="mt-3">
          <label className="text-xs text-slate-300">יעד ברוטו שבועי (₪)</label>
          <input
            value={weeklyGoal}
            onChange={(e) => {
              const next = e.target.value;
              setWeeklyGoal(next);
              writeWeeklyGoalToStorage(next);
            }}
            className="mt-1 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white"
          />
        </div>
        <div className="mt-4 h-4 rounded-full bg-slate-800">
          <div className="h-4 rounded-full bg-emerald-500 transition-all" style={{ width: `${weekProgress}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-200">
          <p>ברוטו השבוע: {money(weekSummary.totalGross)}</p>
          <p>נטו השבוע: {money(weekSummary.totalNet)}</p>
        </div>
        <p className="mt-2 text-sm font-bold text-emerald-200">
          {weekProgress.toFixed(0)}% מהיעד · נשארו {money(weekRemaining)} ברוטו ליעד
        </p>
      </section>
    </main>
  );
}

function isAggregatableSnapshot(item: ScreenshotAnalysisSnapshot): boolean {
  const a = item?.analysis;
  return Boolean(
    a &&
    typeof a.grossIncome === "number" &&
    typeof a.netIncome === "number" &&
    typeof a.activeHours === "number"
  );
}

function summarize(items: ReturnType<typeof listAllShiftAnalyses>) {
  const totalGross = items.reduce((sum, item) => sum + item.analysis.grossIncome, 0);
  const totalNet = items.reduce((sum, item) => sum + item.analysis.netIncome, 0);
  const totalVehicleCost = items.reduce((sum, item) => sum + item.analysis.vehicleCost, 0);
  const totalKm = items.reduce((sum, item) => sum + (item.actualDrivenKm ?? item.analysis.offerDistanceKm), 0);
  const totalHours = items.reduce((sum, item) => sum + item.analysis.activeHours, 0);
  const shiftCount = items.length;
  const avgNetPerHour = totalHours > 0 ? totalNet / totalHours : undefined;
  const avgPerKm = totalKm > 0 ? totalGross / totalKm : undefined;
  const avgGrossPerShift = shiftCount > 0 ? totalGross / shiftCount : 0;
  const avgNetPerShift = shiftCount > 0 ? totalNet / shiftCount : 0;
  const avgHoursPerShift = shiftCount > 0 ? totalHours / shiftCount : 0;

  const sortedByGross = [...items].sort((a, b) => b.analysis.grossIncome - a.analysis.grossIncome);
  const sortedByWorst = [...items].sort((a, b) => a.analysis.grossIncome - b.analysis.grossIncome);
  const best = sortedByGross[0];
  const worst = sortedByWorst[0];

  return {
    totalGross,
    totalNet,
    totalVehicleCost,
    shiftCount,
    totalKm,
    totalHours,
    avgNetPerHour,
    avgPerKm,
    avgGrossPerShift,
    avgNetPerShift,
    avgHoursPerShift,
    bestShift: best ? `${best.shiftDate} · ${money(best.analysis.grossIncome)}` : "-",
    worstShift: worst ? `${worst.shiftDate} · ${money(worst.analysis.grossIncome)}` : "-"
  };
}

function getCurrentMonthInput(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentWeekItems(items: ReturnType<typeof listAllShiftAnalyses>) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return items.filter((item) => {
    const date = new Date(item.shiftDate);
    return date >= start && date < end;
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function money(value: number): string {
  return `₪${value.toFixed(2)}`;
}

function num(value: number): string {
  return value.toFixed(2);
}

function readWeeklyGoalFromStorage(): string {
  if (typeof window === "undefined") return String(DEFAULT_WEEKLY_GOAL);
  try {
    const stored = localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY);
    if (!stored) return String(DEFAULT_WEEKLY_GOAL);
    return stored;
  } catch {
    return String(DEFAULT_WEEKLY_GOAL);
  }
}

function writeWeeklyGoalToStorage(value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, value);
  } catch {
    // Ignore write failures.
  }
}
