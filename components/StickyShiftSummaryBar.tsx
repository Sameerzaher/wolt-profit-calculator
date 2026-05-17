"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import { calculateDashboardStats } from "@/lib/analytics";
import { analyzeDayShift } from "@/src/lib/shiftSegments";
import { getTodayKey } from "@/lib/utils";

export default function StickyShiftSummaryBar() {
  const pathname = usePathname();
  const { deliveries, shifts, dayShifts, appSettings, fuelSettings, isHydrated } = useAppData();
  if (!isHydrated) return null;

  const today = getTodayKey();
  const todayDay = dayShifts.find((record) => record.shiftDate === today);
  const dayAnalysis = todayDay ? analyzeDayShift(todayDay) : null;
  const stats = calculateDashboardStats(deliveries, shifts, fuelSettings, appSettings.dailyTarget);

  const netProfit = dayAnalysis?.totals.totalNetProfit ?? stats.netEstimatedProfit;
  const hourly =
    dayAnalysis && dayAnalysis.totals.totalHours > 0
      ? dayAnalysis.totals.totalNetProfit / dayAnalysis.totals.totalHours
      : stats.ilsPerHour;
  const middleLabel = dayAnalysis ? `${todayDay?.segments.length ?? 0} מקטעים` : `${stats.totalDeliveries} משלוחים`;

  const hiddenOnPaths = ["/quick-check", "/active-shift", "/complete-delivery", "/add-delivery", "/daily-shift", "/platform-analytics"];
  if (hiddenOnPaths.includes(pathname)) return null;

  return (
    <div
      className="fixed left-0 right-0 z-20 px-3"
      style={{ bottom: "var(--nav-height)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-3 py-2 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto text-xs text-slate-300 no-scrollbar sm:gap-3">
          <p className="shrink-0">
            נטו: <span className="font-black text-emerald-300">₪{netProfit.toFixed(0)}</span>
          </p>
          <p className="shrink-0">
            <span className="font-black text-white">{middleLabel}</span>
          </p>
          <p className="shrink-0">
            ₪/שעה: <span className="font-black text-sky-300">{hourly.toFixed(0)}</span>
          </p>
        </div>
        <Link
          href="/daily-shift"
          className="shrink-0 rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200"
        >
          יומי
        </Link>
      </div>
    </div>
  );
}
