"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/courier/MetricCard";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { getFixedDailyCost, getMonthlyFixedTotal } from "@/utils/calculations";
import type { VehicleType } from "@/types/vehicle";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "car", label: "רכב" },
  { value: "scooter", label: "קטנוע" },
  { value: "electric", label: "חשמלי" }
];

export default function VehicleSettingsPage() {
  const { isHydrated, vehicle, setVehicle } = useCourier();
  const [draft, setDraft] = useState(vehicle);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(vehicle);
  }, [vehicle]);

  if (!isHydrated) {
    return <PageSkeleton />;
  }

  const monthlyTotal = getMonthlyFixedTotal(draft);
  const dailyFixed = getFixedDailyCost(draft);

  const save = () => {
    setVehicle(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="app-page space-y-4">
      <ScreenHeader title="הגדרות רכב" subtitle="עלויות דלק ורכב לחישוב רווח נטו מדויק" />

      <section className="app-card">
        <p className="text-label mb-2">סוג רכב</p>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, type: item.value }))}
              className={`btn-pill ${draft.type === item.value ? "btn-pill-active" : "btn-pill-idle"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card space-y-3">
        <NumberField
          label="עלות דלק לק״מ (₪)"
          value={draft.fuelCostPerKm}
          onChange={(v) => setDraft((p) => ({ ...p, fuelCostPerKm: v }))}
        />
        <NumberField
          label="ביטוח חודשי (₪)"
          value={draft.monthlyInsurance}
          onChange={(v) => setDraft((p) => ({ ...p, monthlyInsurance: v }))}
        />
        <NumberField
          label="תחזוקה חודשית (₪)"
          value={draft.monthlyMaintenance}
          onChange={(v) => setDraft((p) => ({ ...p, monthlyMaintenance: v }))}
        />
        <NumberField
          label="עלות רכב חודשית נוספת (₪)"
          value={draft.monthlyVehicleCost}
          onChange={(v) => setDraft((p) => ({ ...p, monthlyVehicleCost: v }))}
          hint="ליסינג, חניה, וכו׳"
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <MetricCard label="סה״כ קבוע חודשי" value={`₪${monthlyTotal.toFixed(0)}`} />
        <MetricCard label="מוקצה ליום (~)" value={`₪${dailyFixed.toFixed(1)}`} accent="amber" />
      </section>

      <p className="text-sm text-slate-500">
        העלויות הקבועות מחולקות ל-30 יום ומתווספות לכל יום עבודה בחישוב הרווח הנטו.
      </p>

      <button
        type="button"
        onClick={save}
        className="btn-primary w-full"
      >
        {saved ? "נשמר ✓" : "שמור הגדרות"}
      </button>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      {hint ? <span className="mr-1 text-xs text-slate-500">({hint})</span> : null}
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="field-input mt-1"
      />
    </label>
  );
}

function toNum(raw: string): number {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

