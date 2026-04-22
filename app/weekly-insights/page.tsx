"use client";

import ScreenHeader from "@/components/ScreenHeader";
import StatCard from "@/components/StatCard";
import WeeklyProfitBars from "@/components/WeeklyProfitBars";
import { useAppData } from "@/components/AppDataProvider";
import { calculateWeeklyInsights } from "@/lib/analytics";

export default function WeeklyInsightsPage() {
  const { deliveries } = useAppData();
  const insights = calculateWeeklyInsights(deliveries);

  return (
    <main className="space-y-4">
      <ScreenHeader title="תובנות שבועיות" subtitle="מתי ואיפה הכי משתלם לעבוד" />

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="יום הכי טוב" value={insights.bestDay} />
        <StatCard label="טווח שעות חזק" value={insights.bestHourRange} />
        <StatCard label="אזור יעד מוביל" value={insights.bestZone} />
        <StatCard label="אזור איסוף מוביל" value={insights.bestPickupZone} />
        <StatCard label="אזור מסירה מוביל" value={insights.bestDropoffZone} />
        <StatCard label="שעה חזקה בחיפה" value={insights.bestTimeHaifa} />
        <StatCard label="שעה חזקה בקריות" value={insights.bestTimeKrayot} />
        <StatCard label="ממוצע ₪/שעה" value={insights.averageIlsPerHour} />
        <StatCard label="דקות למשלוח" value={insights.averageMinutesPerDelivery} />
        <StatCard label="ציון ממוצע חיפה" value={insights.avgScoreHaifa} />
        <StatCard label="ציון ממוצע קריות" value={insights.avgScoreKrayot} />
        <StatCard label="משלוחים חלשים" value={String(insights.lowProfitDeliveries)} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-bold text-white">גרף רווח לפי יום</h3>
        <div className="mt-3">
          <WeeklyProfitBars series={insights.daySeries} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <h3 className="text-base font-bold text-white">המלצה</h3>
        <p className="mt-2">{insights.recommendationSummary}</p>
      </section>
    </main>
  );
}
