"use client";

import type { DayTotals } from "@/types/models";

export default function DayTotalsCard({ totals }: { totals: DayTotals }) {
  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-slate-900 p-4">
      <h2 className="text-lg font-black text-white">סיכום יומי</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Cell label="סה״כ הכנסה" value={`₪${totals.totalIncome.toFixed(0)}`} tone="emerald" />
        <Cell label="סה״כ שעות" value={`${totals.totalHours.toFixed(2)}`} />
        <Cell label="סה״כ ק״מ" value={totals.totalKilometers.toFixed(1)} tone="sky" />
        <Cell label="סה״כ דלק" value={`₪${totals.totalFuelCost.toFixed(1)}`} tone="amber" />
        <Cell label="רווח נטו" value={`₪${totals.totalNetProfit.toFixed(1)}`} tone="emerald" className="col-span-2" large />
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  tone,
  className = "",
  large
}: {
  label: string;
  value: string;
  tone?: "emerald" | "sky" | "amber";
  className?: string;
  large?: boolean;
}) {
  const valueColor =
    tone === "emerald" ? "text-emerald-300" : tone === "sky" ? "text-sky-300" : tone === "amber" ? "text-amber-200" : "text-white";
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950 p-3 ${className}`}>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`mt-1 font-black ${valueColor} ${large ? "text-2xl" : "text-lg"}`}>{value}</p>
    </div>
  );
}
