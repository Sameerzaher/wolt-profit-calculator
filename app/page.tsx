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

  if (!isHydrated) return <p className="text-slate-400">טוען נתונים...</p>;

  const stats = calculateDashboardStats(deliveries, shifts, fuelSettings, appSettings.dailyTarget);
  const shift = calculateActiveShiftSnapshot(deliveries, shifts, fuelSettings, appSettings.dailyTarget, appSettings.activeShiftId);

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

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={startShift}
          className="flex min-h-[3.85rem] w-full items-center justify-center rounded-2xl bg-emerald-500 text-base font-black text-slate-950 active:opacity-90"
        >
          התחל משמרת
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/add-delivery"
            className="flex min-h-[3.85rem] items-center justify-center rounded-2xl border-2 border-emerald-500/45 bg-slate-900 text-base font-black text-emerald-100"
          >
            הוסף משלוח
          </Link>
          <button
            type="button"
            onClick={endShift}
            className="min-h-[3.85rem] rounded-2xl border-2 border-rose-500/45 bg-rose-500/15 text-base font-black text-rose-100"
          >
            סיים משמרת
          </button>
        </div>
        <Link
          href="/quick-check"
          className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-slate-600 bg-slate-900 text-sm font-bold text-slate-200"
        >
          בדיקת הצעה לפני קבלה
        </Link>
        <Link
          href="/active-shift"
          className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-slate-600 bg-slate-900 text-sm font-bold text-slate-200"
        >
          מסך משמרת פעילה
        </Link>
        <Link href="/where-to-go" className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-white">
          איפה כדאי עכשיו
        </Link>
        <Link href="/history" className="flex min-h-[3.1rem] items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-200">
          היסטוריית ניתוחים
        </Link>
        <Link href="/monthly" className="flex min-h-[3.1rem] items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-200">
          סיכום חודשי ושבועי
        </Link>
        <Link
          href="/screenshot-analyzer"
          className="flex min-h-[3.1rem] items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-200"
        >
          ניתוח צילומי מסך
        </Link>
        <Link href="/settings" className="flex min-h-[3.1rem] items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
          הגדרות דלק
        </Link>
      </section>
    </main>
  );
}
