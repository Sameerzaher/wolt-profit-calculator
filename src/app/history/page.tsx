"use client";

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

export default function HistoryPageContent() {
  const { shifts, deliveries, fuelSettings } = useAppData();
  const entries = buildShiftHistoryEntries(shifts, deliveries, fuelSettings);
  const weekly = summarizeCurrentWeek(entries);
  const monthly = summarizeCurrentMonth(entries);
  const weeklyChart = buildWeeklyChartSeries(entries);
  const monthlyChart = buildMonthlyChartSeries(entries);

  return (
    <main className="space-y-4">
      <ScreenHeader title="היסטוריית משמרות" subtitle="רשימת משמרות קודמות וסיכומי ביצועים" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">סיכום שבועי</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
          <p>משמרות: {weekly.shifts}</p>
          <p>הכנסה: ₪{weekly.income.toFixed(0)}</p>
          <p>ק״מ: {weekly.km.toFixed(1)}</p>
          <p>רווח: ₪{weekly.profit.toFixed(0)}</p>
          <p>₪/שעה: {weekly.hourlyRate.toFixed(1)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">סיכום חודשי</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
          <p>משמרות: {monthly.shifts}</p>
          <p>הכנסה: ₪{monthly.income.toFixed(0)}</p>
          <p>ק״מ: {monthly.km.toFixed(1)}</p>
          <p>רווח: ₪{monthly.profit.toFixed(0)}</p>
          <p>₪/שעה: {monthly.hourlyRate.toFixed(1)}</p>
        </div>
      </section>

      <ShiftHistoryCharts weekly={weeklyChart} monthly={monthlyChart} />

      {entries.length === 0 ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
          עדיין אין משמרות שמורות
        </section>
      ) : (
        <section className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
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
      )}
    </main>
  );
}
