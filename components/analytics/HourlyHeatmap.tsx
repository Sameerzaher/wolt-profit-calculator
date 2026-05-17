"use client";

import type { HeatmapCell } from "@/types/analytics";

const HEBREW_DAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HourlyHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.dayOfWeek}-${cell.hour}`, cell);
  }

  if (cells.length === 0) {
    return (
      <section className="app-card">
        <p className="text-label">מפת רווחיות לפי שעה</p>
        <p className="mt-2 text-base text-slate-500">אין מספיק נתונים — הוסיפו מקטעים עם שעות התחלה וסיום</p>
      </section>
    );
  }

  return (
    <section className="app-card overflow-x-auto">
      <p className="text-label">מפת רווחיות לפי שעה</p>
      <p className="mt-1 text-sm text-slate-500">כהה יותר = ₪ נטו לשעה גבוה יותר · גלילה לצדדים</p>
      <div className="mt-3 min-w-[640px]" dir="ltr">
        <div className="grid grid-cols-[2.5rem_repeat(24,1fr)] gap-0.5 text-[9px] text-slate-500">
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-center">
              {h}
            </div>
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
            <HeatmapRow key={dow} dayLabel={HEBREW_DAYS_SHORT[dow]} dow={dow} cellMap={cellMap} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>נמוך</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-l from-slate-800 via-emerald-900 to-emerald-500" />
        <span>גבוה</span>
      </div>
    </section>
  );
}

function HeatmapRow({
  dayLabel,
  dow,
  cellMap
}: {
  dayLabel: string;
  dow: number;
  cellMap: Map<string, HeatmapCell>;
}) {
  return (
    <>
      <div className="flex items-center justify-center text-[10px] font-bold text-slate-400">{dayLabel}</div>
      {HOURS.map((hour) => {
        const cell = cellMap.get(`${dow}-${hour}`);
        const intensity = cell?.intensity ?? 0;
        const title = cell
          ? `${cell.dayName} ${hour}:00 · ₪${cell.netProfitPerHour.toFixed(1)}/שעה · ${cell.segmentCount} מקטעים`
          : "אין נתונים";
        return (
          <div
            key={hour}
            title={title}
            className="flex h-7 items-center justify-center rounded-sm text-[8px] font-bold"
            style={{
              backgroundColor: intensity > 0 ? `rgba(16, 185, 129, ${0.12 + intensity * 0.88})` : "#0f172a",
              color: intensity > 0.4 ? "#ecfdf5" : "#475569"
            }}
          >
            {cell && intensity > 0.25 ? cell.netProfitPerHour.toFixed(0) : ""}
          </div>
        );
      })}
    </>
  );
}
