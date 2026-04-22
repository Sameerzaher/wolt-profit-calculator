"use client";

import BigActionButton from "@/components/BigActionButton";
import OnboardingTooltip from "@/components/OnboardingTooltip";
import ScreenHeader from "@/components/ScreenHeader";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/components/AppDataProvider";
import { calculateDashboardStats } from "@/lib/analytics";

export default function HomePage() {
  const { deliveries, shifts, appSettings, fuelSettings, isHydrated } = useAppData();
  const stats = calculateDashboardStats(deliveries, shifts, fuelSettings, appSettings.dailyTarget);

  if (!isHydrated) return <p className="text-slate-400">טוען נתונים...</p>;

  return (
    <main className="space-y-4">
      <ScreenHeader title="WoltCalc V2" subtitle="Cockpit חכם לרווחיות בזמן אמת" />
      <OnboardingTooltip />

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="הכנסה היום" value={stats.todayIncome} asMoney />
        <StatCard label="רווח נקי משוער" value={stats.netEstimatedProfit} asMoney />
        <StatCard label="סה״כ משלוחים" value={String(stats.totalDeliveries)} />
        <StatCard label="שעות נטו" value={stats.netWorkHours} />
        <StatCard label="₪ לשעה" value={stats.ilsPerHour} />
        <StatCard label="עלות דלק" value={stats.estimatedFuelCost} asMoney />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">התקדמות יעד יומי</p>
        <div className="mt-2 h-3 rounded-full bg-slate-800">
          <div
            className="h-3 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, stats.dailyTargetProgress)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">{stats.dailyTargetProgress.toFixed(1)}%</p>
      </section>

      <section className="space-y-3">
        <BigActionButton href="/quick-check" title="בדיקה מהירה" subtitle="לקבל החלטת קבלה תוך שניות" />
        <BigActionButton href="/active-delivery" title="משלוח פעיל" subtitle="טיימר ולחצני סטטוס בשטח" />
        <BigActionButton href="/weekly-insights" title="תובנות שבועיות" subtitle="אילו שעות ואזורים עובדים לך הכי טוב" />
        <BigActionButton href="/zone-performance" title="ביצועי אזורים" subtitle="ממוצעי הכנסה/זמן וציון לכל אזור" />
      </section>
    </main>
  );
}
