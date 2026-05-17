"use client";

import type { DateRangePreset } from "@/src/types/platform-analytics";

type DateRangeFilterBarProps = {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  today: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "היום" },
  { id: "week", label: "השבוע" },
  { id: "month", label: "החודש" },
  { id: "custom", label: "טווח" }
];

export default function DateRangeFilterBar({
  preset,
  startDate,
  endDate,
  today,
  onPresetChange,
  onStartDateChange,
  onEndDateChange
}: DateRangeFilterBarProps) {
  return (
    <section className="app-card">
      <p className="text-sm font-bold text-slate-200">סינון לפי תאריך</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((item) => {
          const active = preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPresetChange(item.id)}
              className={`btn-pill ${active ? "btn-pill-active" : "btn-pill-idle"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {preset === "custom" ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block text-xs text-slate-400">
            מתאריך
            <input
              type="date"
              value={startDate}
              max={endDate || today}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="date-input mt-1"
            />
          </label>
          <label className="block text-xs text-slate-400">
            עד תאריך
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="date-input mt-1"
            />
          </label>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500" dir="ltr">
          {startDate === endDate ? startDate : `${startDate} → ${endDate}`}
        </p>
      )}
    </section>
  );
}
