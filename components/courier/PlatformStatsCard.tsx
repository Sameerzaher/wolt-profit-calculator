"use client";

import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import type { PlatformStats } from "@/types/analytics";

export default function PlatformStatsCard({ stats }: { stats: PlatformStats }) {
  return (
    <GlassCard variant="elevated">
      <div className="mb-4">
        <PlatformBadge platform={stats.platform} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
        <Cell label="משמרות" value={String(stats.shiftCount)} />
        <Cell label="הכנסה" value={`₪${stats.totalIncome.toFixed(0)}`} />
        <Cell label="שעות" value={stats.totalHours.toFixed(2)} />
        <Cell label="ק״מ" value={stats.totalKilometers.toFixed(1)} />
        <Cell label="משלוחים" value={String(stats.totalDeliveries)} />
        <Cell label="דלק" value={`₪${stats.fuelCost.toFixed(0)}`} />
        <Cell label="נטו" value={`₪${stats.netProfit.toFixed(0)}`} highlight />
        <Cell label="נטו/שעה" value={`₪${stats.netProfitPerHour.toFixed(1)}`} highlight />
        <Cell label="₪/ק״מ" value={stats.incomePerKm > 0 ? `₪${stats.incomePerKm.toFixed(2)}` : "—"} />
      </div>
    </GlassCard>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="glass rounded-xl p-2.5">
      <p className="text-label">{label}</p>
      <p className={`text-base font-bold ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
