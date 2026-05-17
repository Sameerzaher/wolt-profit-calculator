"use client";

import PlatformSelector from "@/components/shift/PlatformSelector";
import type { SegmentMetrics, ShiftSegment } from "@/types/models";
import { PLATFORM_LABELS } from "@/src/types/delivery-platform";

type ShiftSegmentCardProps = {
  index: number;
  segment: ShiftSegment;
  metrics: SegmentMetrics;
  onChange: (patch: Partial<ShiftSegment>) => void;
  onRemove: () => void;
};

const inputClass = "field-input";

export default function ShiftSegmentCard({ index, segment, metrics, onChange, onRemove }: ShiftSegmentCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-white">
          מקטע {index + 1} · {PLATFORM_LABELS[segment.platform]}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-100"
        >
          הסר
        </button>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-bold text-slate-400">פלטפורמה</p>
        <PlatformSelector value={segment.platform} onChange={(platform) => onChange({ platform })} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="התחלה">
          <input type="time" value={segment.startTime} onChange={(e) => onChange({ startTime: e.target.value })} className={inputClass} />
        </Field>
        <Field label="סיום">
          <input type="time" value={segment.endTime} onChange={(e) => onChange({ endTime: e.target.value })} className={inputClass} />
        </Field>
        <Field label="הכנסה (₪)">
          <input
            type="number"
            inputMode="decimal"
            value={segment.incomeIls || ""}
            onChange={(e) => onChange({ incomeIls: toNumber(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="ק״מ">
          <input
            type="number"
            inputMode="decimal"
            value={segment.kilometers || ""}
            onChange={(e) => onChange({ kilometers: toNumber(e.target.value) })}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="mt-2 flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={segment.endsNextDay ?? false}
          onChange={(e) => onChange({ endsNextDay: e.target.checked })}
        />
        מסתיים ביום הבא
      </label>

      <Field label="הערות (אופציונלי)" className="mt-2">
        <input
          type="text"
          value={segment.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="למשל: אזור מרכז, גשם..."
          className={inputClass}
        />
      </Field>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Metric label="משך" value={`${metrics.durationHours.toFixed(2)} שע׳`} />
        <Metric label="₪ לשעה" value={`₪${metrics.incomePerHour.toFixed(1)}`} />
        <Metric label="₪ לק״מ" value={metrics.incomePerKm > 0 ? `₪${metrics.incomePerKm.toFixed(2)}` : "-"} />
        <Metric label="דלק משוער" value={`₪${metrics.fuelCost.toFixed(1)}`} />
        <Metric label="רווח נטו" value={`₪${metrics.netProfit.toFixed(1)}`} highlight />
      </div>
    </article>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-900 px-2 py-2">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-0.5 font-black ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
