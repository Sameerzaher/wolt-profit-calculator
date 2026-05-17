"use client";

import { Trash2 } from "lucide-react";
import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/ui/motion";
import { calculateDuration, calculateEstimatedExpenses, calculateNetProfit } from "@/utils/calculations";
import { PLATFORMS, PLATFORM_LABELS } from "@/types/platform";
import type { SegmentWeather, ShiftSegment } from "@/types/shift";
import type { VehicleSettings } from "@/types/vehicle";

type SegmentEditorProps = {
  index: number;
  segment: ShiftSegment;
  vehicle: VehicleSettings;
  onChange: (patch: Partial<ShiftSegment>) => void;
  onRemove: () => void;
};

const WEATHER_OPTIONS: { value: SegmentWeather; label: string }[] = [
  { value: "clear", label: "בהיר" },
  { value: "rain", label: "גשם" },
  { value: "heat", label: "חום" },
  { value: "cold", label: "קר" }
];

export default function SegmentEditor({ index, segment, vehicle, onChange, onRemove }: SegmentEditorProps) {
  const hours = calculateDuration(segment);
  const expenses = calculateEstimatedExpenses(segment.kilometers, vehicle, { includeFixedDaily: false });
  const net = calculateNetProfit(segment.income, expenses);
  const perHour = hours > 0 ? segment.income / hours : 0;

  return (
    <FadeIn>
      <GlassCard variant="elevated" padding="md" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold text-white">
            מקטע {index + 1} · <PlatformBadge platform={segment.platform} />
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200"
            aria-label="הסר מקטע"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => onChange({ platform })}
              className={`btn-pill ${segment.platform === platform ? "btn-pill-active" : "btn-pill-idle"}`}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="התחלה">
            <input
              type="time"
              value={segment.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              className="date-input"
            />
          </Field>
          <Field label="סיום">
            <input
              type="time"
              value={segment.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              className="date-input"
            />
          </Field>
          <Field label="הכנסה (₪)">
            <input
              type="number"
              inputMode="decimal"
              value={segment.income || ""}
              onChange={(e) => onChange({ income: toNum(e.target.value) })}
              className="field-input"
              dir="ltr"
            />
          </Field>
          <Field label="ק״מ">
            <input
              type="number"
              inputMode="decimal"
              value={segment.kilometers || ""}
              onChange={(e) => onChange({ kilometers: toNum(e.target.value) })}
              className="field-input"
              dir="ltr"
            />
          </Field>
          <Field label="משלוחים">
            <input
              type="number"
              inputMode="numeric"
              value={segment.deliveriesCount || ""}
              onChange={(e) => onChange({ deliveriesCount: Math.max(0, Math.round(toNum(e.target.value))) })}
              className="field-input"
              dir="ltr"
            />
          </Field>
          <Field label="מזג אוויר">
            <select
              value={segment.weather ?? "clear"}
              onChange={(e) => onChange({ weather: e.target.value as SegmentWeather })}
              className="field-input"
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-3 text-base text-slate-300">
          <input
            type="checkbox"
            checked={segment.endsNextDay ?? false}
            onChange={(e) => onChange({ endsNextDay: e.target.checked })}
            className="h-5 w-5 rounded border-white/20"
          />
          מסתיים ביום למחרת
        </label>
        <label className="flex items-center gap-3 text-base text-slate-300">
          <input
            type="checkbox"
            checked={segment.rushHour}
            onChange={(e) => onChange({ rushHour: e.target.checked })}
            className="h-5 w-5 rounded border-white/20"
          />
          שעות עומס
        </label>

        <Field label="הערות">
          <input
            type="text"
            value={segment.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="אזור, מסעדה..."
            className="field-input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Stat label="משך" value={`${hours.toFixed(2)} שע׳`} />
          <Stat label="₪ לשעה" value={`₪${perHour.toFixed(1)}`} />
          <Stat label="דלק" value={`₪${expenses.toFixed(1)}`} />
          <Stat label="נטו" value={`₪${net.toFixed(1)}`} highlight />
        </div>
      </GlassCard>
    </FadeIn>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-label">{label}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-emerald-300" : "text-white"}`} dir="ltr">
        {value}
      </p>
    </div>
  );
}

function toNum(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
