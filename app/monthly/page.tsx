"use client";

import { useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { listAllShiftAnalyses } from "@/lib/storage";

const DEFAULT_WEEKLY_GOAL = 2900;

export default function MonthlyPage() {
  const analyses = useMemo(() => listAllShiftAnalyses(), []);
  const [month, setMonth] = useState(getCurrentMonthInput());
  const [weeklyGoal, setWeeklyGoal] = useState(String(DEFAULT_WEEKLY_GOAL));

  const monthItems = analyses.filter((item) => item.shiftDate.startsWith(month));
  const monthSummary = summarize(monthItems);
  const weekSummary = summarize(getCurrentWeekItems(analyses));
  const weeklyGoalValue = Number(weeklyGoal) || DEFAULT_WEEKLY_GOAL;
  const weekProgress = Math.min(100, (weekSummary.totalGross / weeklyGoalValue) * 100);

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

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <Metric label="ברוטו כולל" value={money(monthSummary.totalGross)} />
        <Metric label="נטו כולל" value={money(monthSummary.totalNet)} />
        <Metric label="סה״כ ק״מ" value={num(monthSummary.totalKm)} />
        <Metric label="סה״כ שעות" value={num(monthSummary.totalHours)} />
        <Metric label="ממוצע ₪/שעה" value={monthSummary.avgPerHour ? money(monthSummary.avgPerHour) : "-"} />
        <Metric label="ממוצע ₪/ק״מ" value={monthSummary.avgPerKm ? money(monthSummary.avgPerKm) : "-"} />
        <Metric label="משמרת הכי טובה" value={monthSummary.bestShift ?? "-"} />
        <Metric label="משמרת הכי חלשה" value={monthSummary.worstShift ?? "-"} />
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4">
        <p className="text-sm font-bold text-slate-100">יעד שבועי</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-200">
          <p>ברוטו: {money(weekSummary.totalGross)}</p>
          <p>נטו: {money(weekSummary.totalNet)}</p>
        </div>
        <div className="mt-3">
          <label className="text-xs text-slate-300">יעד שבועי (₪)</label>
          <input
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          />
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-800">
          <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${weekProgress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-300">
          {weekProgress.toFixed(1)}% מהיעד | חסר {money(Math.max(0, weeklyGoalValue - weekSummary.totalGross))}
        </p>
      </section>
    </main>
  );
}

function summarize(items: ReturnType<typeof listAllShiftAnalyses>) {
  const totalGross = items.reduce((sum, item) => sum + item.analysis.grossIncome, 0);
  const totalNet = items.reduce((sum, item) => sum + (item.analysis.estimatedNetIncome ?? item.analysis.grossIncome), 0);
  const totalKm = items.reduce((sum, item) => sum + (item.actualDrivenKm ?? item.analysis.totalOfferKm), 0);
  const totalHours = items.reduce((sum, item) => sum + (item.analysis.activeWorkHours ?? item.analysis.estimatedDurationHours ?? 0), 0);
  const avgPerHour = totalHours > 0 ? totalGross / totalHours : undefined;
  const avgPerKm = totalKm > 0 ? totalGross / totalKm : undefined;

  const sortedByGross = [...items].sort((a, b) => b.analysis.grossIncome - a.analysis.grossIncome);
  const sortedByWorst = [...items].sort((a, b) => a.analysis.grossIncome - b.analysis.grossIncome);

  return {
    totalGross,
    totalNet,
    totalShifts: items.length,
    totalKm,
    totalHours,
    avgPerHour,
    avgPerKm,
    bestShift: sortedByGross[0]?.shiftDate,
    worstShift: sortedByWorst[0]?.shiftDate
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
