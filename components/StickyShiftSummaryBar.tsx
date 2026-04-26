"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import { calculateDashboardStats } from "@/lib/analytics";

export default function StickyShiftSummaryBar() {
  const pathname = usePathname();
  const { deliveries, shifts, appSettings, fuelSettings, isHydrated } = useAppData();
  if (!isHydrated) return null;

  const stats = calculateDashboardStats(deliveries, shifts, fuelSettings, appSettings.dailyTarget);
  const hiddenOnPaths = ["/quick-check", "/active-shift", "/complete-delivery", "/add-delivery"];
  if (hiddenOnPaths.includes(pathname)) return null;

  return (
    <div className="fixed bottom-[4.75rem] left-0 right-0 z-20 px-3">
      <div className="mx-auto flex max-w-lg items-center justify-between rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-4 text-xs text-slate-300">
          <p>
            נטו: <span className="font-black text-emerald-300">₪{stats.netEstimatedProfit.toFixed(0)}</span>
          </p>
          <p>
            משלוחים: <span className="font-black text-white">{stats.totalDeliveries}</span>
          </p>
          <p>
            ₪/שעה: <span className="font-black text-sky-300">{stats.ilsPerHour.toFixed(0)}</span>
          </p>
        </div>
        <Link href="/active-shift" className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
          משמרת
        </Link>
      </div>
    </div>
  );
}
