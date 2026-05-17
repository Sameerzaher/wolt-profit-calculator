"use client";

import Link from "next/link";
import ScreenHeader from "@/components/ScreenHeader";
import ShiftHistoryCharts from "@/components/ShiftHistoryCharts";
import { useAppData } from "@/components/AppDataProvider";
import {
  buildMonthlyChartSeries,
  buildShiftHistoryEntries,
  buildWeeklyChartSeries,
  summarizeCurrentMonth,
  summarizeCurrentWeek
} from "@/lib/analytics";
import { analyzeDayShift } from "@/src/lib/shiftSegments";
import { PLATFORM_LABELS } from "@/src/types/delivery-platform";

export default function HistoryPageContent() {
  const { shifts, deliveries, fuelSettings, dayShifts } = useAppData();
  const entries = buildShiftHistoryEntries(shifts, deliveries, fuelSettings);
  const weekly = summarizeCurrentWeek(entries);
  const monthly = summarizeCurrentMonth(entries);
  const weeklyChart = buildWeeklyChartSeries(entries);
  const monthlyChart = buildMonthlyChartSeries(entries);

  const dayEntries = dayShifts
    .map((record) => {
      const analysis = analyzeDayShift(record);
      const platforms = analysis.byPlatform.map((row) => PLATFORM_LABELS[row.platform]).join(" · ");
      return {
        shiftDate: record.shiftDate,
        totals: analysis.totals,
        platforms,
        comparison: analysis.comparison
      };
    })
    .sort((a, b) => b.shiftDate.localeCompare(a.shiftDate));

  return (
    <main className="space-y-4">
      <ScreenHeader title="היסטוריית משמרות" subtitle="ימים שמורים לפי פלטפורמה + מעקב משלוחים חי" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">סיכום שבועי (משלוחים חיים)</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
          <p>משמרות: {weekly.shifts}</p>
          <p>הכנסה: ₪{weekly.income.toFixed(0)}</p>
          <p>ק״מ: {weekly.km.toFixed(1)}</p>
          <p>רווח: ₪{weekly.profit.toFixed(0)}</p>
          <p>₪/שעה: {weekly.hourlyRate.toFixed(1)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">סיכום חודשי (משלוחים חיים)</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
          <p>משמרות: {monthly.shifts}</p>
          <p>הכנסה: ₪{monthly.income.toFixed(0)}</p>
          <p>ק״מ: {monthly.km.toFixed(1)}</p>
          <p>רווח: ₪{monthly.profit.toFixed(0)}</p>
          <p>₪/שעה: {monthly.hourlyRate.toFixed(1)}</p>
        </div>
      </section>

      <ShiftHistoryCharts weekly={weeklyChart} monthly={monthlyChart} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white">ימי עבודה (רב-פלטפורמי)</h2>
          <Link href="/daily-shift" className="text-xs font-bold text-emerald-300">
            + יום חדש
          </Link>
        </div>

        {dayEntries.length === 0 ? (
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
            אין ימים שמורים עדיין.{" "}
            <Link href="/daily-shift" className="font-bold text-emerald-300">
              הוסף משמרת יומית
            </Link>
          </article>
        ) : (
          dayEntries.map((entry) => (
            <article key={entry.shiftDate} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-white">{entry.shiftDate}</p>
                <Link href={`/daily-shift?date=${entry.shiftDate}`} className="text-xs font-bold text-emerald-300">
                  עריכה
                </Link>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{entry.platforms || "—"}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
                <p>הכנסה: ₪{entry.totals.totalIncome.toFixed(0)}</p>
                <p>שעות: {entry.totals.totalHours.toFixed(2)}</p>
                <p>רווח נטו: ₪{entry.totals.totalNetProfit.toFixed(1)}</p>
                <p>ק״מ: {entry.totals.totalKilometers.toFixed(1)}</p>
              </div>
              {entry.comparison.bestNetProfitPerHour ? (
                <p className="mt-2 text-[11px] text-emerald-200">
                  הכי משתלם: {PLATFORM_LABELS[entry.comparison.bestNetProfitPerHour.platform]} (
                  ₪{entry.comparison.bestNetProfitPerHour.value.toFixed(1)}/שעה נטו)
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>

      {entries.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-black text-slate-400">משמרות חיות (Wolt)</h2>
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 opacity-90">
              <p className="text-sm font-black text-white">{entry.date}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
                <p>הכנסה: ₪{entry.income.toFixed(2)}</p>
                <p>ק״מ: {entry.km.toFixed(2)}</p>
                <p>רווח: ₪{entry.profit.toFixed(2)}</p>
                <p>₪/שעה: {entry.hourlyRate.toFixed(2)}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
