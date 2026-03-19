"use client";

import type { ChangeEvent } from "react";
import type { ScoringSettings } from "@/lib/types";

type SettingsCardProps = {
  settings: ScoringSettings;
  onChange: (next: ScoringSettings) => void;
  onReset: () => void;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export default function SettingsCard({ settings, onChange, onReset }: SettingsCardProps) {
  const setNumber =
    (key: keyof ScoringSettings, min: number, max: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = clamp(Number(e.target.value), min, max);
      onChange({ ...settings, [key]: value });
    };

  return (
    <details className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <summary className="cursor-pointer select-none text-base font-bold">הגדרות אישיות</summary>
      <p className="mt-2 text-sm text-muted">כוונן משקלים לפי סגנון הנהיגה שלך בקריות (נשמר מקומית בלבד).</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="label-base" htmlFor="costPerKm">
            עלות לרכב לק״מ (₪)
          </label>
          <input
            id="costPerKm"
            type="number"
            step="0.05"
            className="input-base"
            value={settings.costPerKm}
            onChange={setNumber("costPerKm", 0, 10)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base" htmlFor="peakBonus">
              בונוס עומס
            </label>
            <input
              id="peakBonus"
              type="number"
              step="0.01"
              className="input-base"
              value={settings.peakBonus}
              onChange={setNumber("peakBonus", 0, 1)}
            />
          </div>
          <div>
            <label className="label-base" htmlFor="hotPenalty">
              קנס מחוץ לאזור
            </label>
            <input
              id="hotPenalty"
              type="number"
              step="0.01"
              className="input-base"
              value={settings.outOfHotZonePenalty}
              onChange={setNumber("outOfHotZonePenalty", 0, 1)}
            />
          </div>
          <div>
            <label className="label-base" htmlFor="lowChance">
              קנס סיכוי נמוך
            </label>
            <input
              id="lowChance"
              type="number"
              step="0.01"
              className="input-base"
              value={settings.lowChancePenalty}
              onChange={setNumber("lowChancePenalty", 0, 1)}
            />
          </div>
          <div>
            <label className="label-base" htmlFor="mediumChance">
              קנס סיכוי בינוני
            </label>
            <input
              id="mediumChance"
              type="number"
              step="0.01"
              className="input-base"
              value={settings.mediumChancePenalty}
              onChange={setNumber("mediumChancePenalty", 0, 1)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          איפוס לברירת מחדל
        </button>
      </div>
    </details>
  );
}
