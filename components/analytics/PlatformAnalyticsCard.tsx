"use client";

import type { PlatformAnalyticsRow } from "@/src/types/platform-analytics";
import { formatShiftDateLabel } from "@/src/lib/platformAnalytics";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/src/types/delivery-platform";

const cardBorder: Record<string, string> = {
  emerald: "border-emerald-500/30",
  sky: "border-sky-500/30",
  amber: "border-amber-500/30"
};

const titleColor: Record<string, string> = {
  emerald: "text-emerald-300",
  sky: "text-sky-300",
  amber: "text-amber-200"
};

export default function PlatformAnalyticsCard({ row }: { row: PlatformAnalyticsRow }) {
  const tone = PLATFORM_COLORS[row.platform];
  const empty = row.totalShifts === 0;

  return (
    <article className={`rounded-2xl border bg-slate-900 p-4 ${cardBorder[tone] ?? cardBorder.emerald}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={`text-lg font-black ${titleColor[tone] ?? titleColor.emerald}`}>{PLATFORM_LABELS[row.platform]}</h2>
        <span className="rounded-lg bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">{row.totalShifts} משמרות</span>
      </div>

      {empty ? (
        <p className="mt-4 text-sm text-slate-400">אין נתונים בתקופה הזו</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="סה״כ הכנסה" value={`₪${row.totalIncome.toFixed(0)}`} />
            <Metric label="סה״כ שעות" value={row.totalHours.toFixed(2)} />
            <Metric label="סה״כ ק״מ" value={row.totalKilometers.toFixed(1)} />
            <Metric label="דלק משוער" value={`₪${row.totalFuelCost.toFixed(0)}`} />
            <Metric label="רווח נטו" value={`₪${row.totalNetProfit.toFixed(0)}`} highlight />
            <Metric label="ממוצע נטו לשעה" value={`₪${row.averageNetPerHour.toFixed(1)}`} highlight />
            <Metric
              label="ממוצע ₪ לק״מ"
              value={row.averageIncomePerKm > 0 ? `₪${row.averageIncomePerKm.toFixed(2)}` : "—"}
              className="col-span-2"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DayHighlight label="יום הכי טוב" day={row.bestDay} variant="good" />
            <DayHighlight label="יום הכי חלש" day={row.worstDay} variant="weak" />
          </div>
        </>
      )}
    </article>
  );
}

function Metric({
  label,
  value,
  highlight,
  className = ""
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950 p-3 ${className}`}>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function DayHighlight({
  label,
  day,
  variant
}: {
  label: string;
  day: PlatformAnalyticsRow["bestDay"];
  variant: "good" | "weak";
}) {
  const border = variant === "good" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5";
  if (!day) {
    return (
      <div className={`rounded-xl border p-3 ${border}`}>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="mt-1 text-sm text-slate-500">—</p>
      </div>
    );
  }
  return (
    <div className={`rounded-xl border p-3 ${border}`}>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{formatShiftDateLabel(day.shiftDate)}</p>
      <p className="text-xs text-slate-300">
        נטו ₪{day.netProfit.toFixed(0)} · {day.hours.toFixed(1)} שע׳
      </p>
    </div>
  );
}
