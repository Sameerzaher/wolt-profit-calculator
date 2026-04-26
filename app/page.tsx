"use client";

import Link from "next/link";
import OnboardingTooltip from "@/components/OnboardingTooltip";
import ScreenHeader from "@/components/ScreenHeader";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/components/AppDataProvider";
import { calculateDashboardStats } from "@/lib/analytics";
import { calculateActiveShiftSnapshot } from "@/features/shifts/momentum";

export default function HomePage() {
  const { deliveries, shifts, appSettings, fuelSettings, isHydrated, startShift, endShift } = useAppData();
  const stats = calculateDashboardStats(deliveries, shifts, fuelSettings, appSettings.dailyTarget);
  const shift = calculateActiveShiftSnapshot(deliveries, shifts, fuelSettings, appSettings.dailyTarget, appSettings.activeShiftId);

  if (!isHydrated) return <p className="text-slate-400">טוען נתונים...</p>;

  return (
    <main className="space-y-4">
      <ScreenHeader title="לוח שליטה חי" subtitle="כל מה שצריך כדי להרוויח יותר בכל משמרת" />
      <OnboardingTooltip />

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="ברוטו היום" value={stats.todayIncome} asMoney />
        <StatCard label="נטו משוער" value={stats.netEstimatedProfit} asMoney />
        <StatCard label="שעות עבודה" value={stats.netWorkHours} />
        <StatCard label="₪ לשעה" value={stats.ilsPerHour} />
        <StatCard label="מספר משלוחים" value={String(stats.totalDeliveries)} />
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

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">תמונת משמרת</p>
        <p className="mt-2 text-lg font-black text-white">{shift.momentumLabel}</p>
        <p className="text-xs text-slate-400">
          חסרים ₪{shift.targetRemaining.toFixed(0)} | בערך עוד {shift.missingHoursToTarget.toFixed(1)} שעות
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/quick-check" className="flex min-h-[3.3rem] items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950">
          בדוק משלוח
        </Link>
        <button
          type="button"
          onClick={startShift}
          className="min-h-[3.3rem] rounded-xl border border-slate-700 bg-slate-900 text-sm font-black text-slate-100"
        >
          התחל משמרת
        </button>
        <button
          type="button"
          onClick={endShift}
          className="min-h-[3.3rem] rounded-xl border border-rose-500/40 bg-rose-500/20 text-sm font-black text-rose-100"
        >
          סיים משמרת
        </button>
        <Link href="/where-to-go" className="flex min-h-[3.3rem] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-black text-white">
          איפה כדאי עכשיו
        </Link>
        <Link href="/history" className="col-span-2 flex min-h-[3.1rem] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-200">
          היסטוריה
        </Link>
        <Link href="/settings" className="col-span-2 flex min-h-[3.1rem] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
          הגדרות דלק
        </Link>
      </section>
    </main>
  );
}
