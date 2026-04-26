"use client";

import { useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { calculateFuelCost } from "@/lib/scoring";

export default function SettingsPage() {
  const {
    fuelSettings,
    appSettings,
    preferredZones,
    updateFuelSettings,
    updateAppSettings,
    updatePreferredZones,
    seedDemoData,
    exportData,
    resetData
  } = useAppData();

  const [zoneInput, setZoneInput] = useState("");
  const computedCostPerKm = useMemo(
    () => (fuelSettings.kmPerLiter > 0 ? fuelSettings.fuelPricePerLiter / fuelSettings.kmPerLiter : 0),
    [fuelSettings]
  );

  return (
    <main className="space-y-4">
      <ScreenHeader title="הגדרות" subtitle="דלק, העדפות אזור ופעולות נתונים" />

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-bold text-white">הגדרות דלק</h3>
        <label className="block text-sm text-slate-300">
          שם רכב
          <input
            value={fuelSettings.vehicleName}
            onChange={(event) => updateFuelSettings({ ...fuelSettings, vehicleName: event.target.value })}
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          ק״מ לליטר
          <input
            type="number"
            value={fuelSettings.kmPerLiter}
            onChange={(event) => updateFuelSettings({ ...fuelSettings, kmPerLiter: Number(event.target.value) || 0 })}
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          מחיר לליטר
          <input
            type="number"
            value={fuelSettings.fuelPricePerLiter}
            onChange={(event) =>
              updateFuelSettings({ ...fuelSettings, fuelPricePerLiter: Number(event.target.value) || 0 })
            }
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          עלות לק״מ (override)
          <input
            type="number"
            value={fuelSettings.costPerKm}
            onChange={(event) => updateFuelSettings({ ...fuelSettings, costPerKm: Number(event.target.value) || 0 })}
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
        </label>
        <p className="text-xs text-slate-500">
          מחושב אוטומטית: ₪{computedCostPerKm.toFixed(2)} לק״מ | בפועל לשימוש כרגע: ₪
          {calculateFuelCost(1, fuelSettings).toFixed(2)} לק״מ
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-bold text-white">יעד יומי ואונבורדינג</h3>
        <label className="block text-sm text-slate-300">
          יעד יומי (₪)
          <input
            type="number"
            value={appSettings.dailyTarget}
            onChange={(event) => updateAppSettings({ ...appSettings, dailyTarget: Number(event.target.value) || 0 })}
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
        </label>
        <button
          type="button"
          className="h-11 rounded-xl border border-slate-700 px-4 text-sm text-slate-200"
          onClick={() => updateAppSettings({ ...appSettings, onboardingDone: false })}
        >
          הפעל מחדש מדריך פתיחה
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-bold text-white">אזורים מועדפים</h3>
        <div className="flex gap-2">
          <input
            value={zoneInput}
            onChange={(event) => setZoneInput(event.target.value)}
            placeholder="הוסף אזור"
            className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          />
          <button
            type="button"
            onClick={() => {
              const zone = zoneInput.trim();
              if (!zone) return;
              if (!preferredZones.includes(zone)) {
                updatePreferredZones([zone, ...preferredZones]);
              }
              setZoneInput("");
            }}
            className="h-11 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-slate-950"
          >
            הוסף
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {preferredZones.map((zone) => (
            <button
              key={zone}
              type="button"
              className="rounded-full border border-emerald-500/50 px-3 py-1 text-xs text-emerald-200"
              onClick={() => updatePreferredZones(preferredZones.filter((item) => item !== zone))}
            >
              {zone} ×
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={seedDemoData} className="h-12 rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-white">
          טען נתוני דמו
        </button>
        <button type="button" onClick={exportData} className="h-12 rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-white">
          ייצוא JSON
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("לאפס את כל הנתונים?")) resetData();
          }}
          className="col-span-2 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white"
        >
          איפוס כל הנתונים
        </button>
      </section>
    </main>
  );
}
