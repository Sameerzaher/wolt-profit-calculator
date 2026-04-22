"use client";

import ScreenHeader from "@/components/ScreenHeader";
import ShiftSummaryCard from "@/components/ShiftSummaryCard";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/components/AppDataProvider";
import { calculateShiftStats } from "@/lib/analytics";

export default function ShiftStatsPage() {
  const { deliveries, shifts, fuelSettings } = useAppData();
  const latestShift = shifts[0];
  const stats = calculateShiftStats(deliveries, fuelSettings, latestShift);

  return (
    <main className="space-y-4">
      <ScreenHeader title="סטטיסטיקת משמרת" subtitle="מדדי ביצוע ורווחיות למשמרת פעילה" />
      <ShiftSummaryCard
        grossIncome={stats.grossIncome}
        netProfit={stats.netProfit}
        ilsPerHour={stats.ilsPerHour}
        totalDeliveries={stats.totalDeliveries}
      />
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="טיפים" value={stats.tips} asMoney />
        <StatCard label="עלות דלק" value={stats.estimatedFuelCost} asMoney />
        <StatCard label="זמן כולל (שעות)" value={stats.totalTime} />
        <StatCard label="זמן המתנה" value={`${stats.idleTimeEstimate} דק׳`} />
        <StatCard label="₪ / ק״מ" value={stats.ilsPerKm} />
      </section>
    </main>
  );
}
