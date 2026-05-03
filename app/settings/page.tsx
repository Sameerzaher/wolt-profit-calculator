"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { BACKUP_SCHEMA_VERSION } from "@/lib/constants";
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
    importBackup,
    resetData
  } = useAppData();
  const router = useRouter();

  const [zoneInput, setZoneInput] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      <section className="space-y-3 rounded-2xl border border-emerald-500/25 bg-slate-900/80 p-4">
        <h3 className="text-base font-bold text-white">גיבוי ושחזור מלא</h3>
        <p className="text-xs leading-relaxed text-slate-400">
          הקובץ כולל משלוחים, משמרות חיות, הגדרות דלק, אזורים מועדפים, <strong className="text-slate-300">ניתוחי צילומי מסך</strong>{" "}
          (אם קיימים) ויעד שבועי. פורמט גרסה {BACKUP_SCHEMA_VERSION}. קבצים ישנים יותר בלי ניתוחים — עדיין ניתן לייבא את חלק
          המשלוחים.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exportData}
            className="min-h-12 flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-black text-slate-950"
            aria-label="ייצוא קובץ גיבוי מלא"
          >
            ייצוא גיבוי מלא
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-12 flex-1 rounded-xl border border-emerald-500/40 bg-slate-950 px-4 text-sm font-bold text-emerald-100"
            aria-label="ייבוא גיבוי מקובץ"
          >
            ייבוא מקובץ
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setImportMessage(null);
            const reader = new FileReader();
            reader.onload = () => {
              const text = typeof reader.result === "string" ? reader.result : "";
              const result = importBackup(text);
              if (result.ok) {
                setImportMessage("הגיבוי יובא בהצלחה.");
                router.refresh();
              } else {
                setImportMessage(result.error);
              }
            };
            reader.onerror = () => setImportMessage("לא ניתן לקרוא את הקובץ.");
            reader.readAsText(file, "UTF-8");
          }}
        />
        {importMessage ? (
          <p className={`text-sm ${importMessage.includes("הצלחה") ? "text-emerald-300" : "text-rose-300"}`} role="status">
            {importMessage}
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={seedDemoData} className="h-12 rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-white">
          טען נתוני דמו
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("לאפס את כל הנתונים? פעולה זו אינה משחזרת מגיבוי אוטומטית.")) resetData();
          }}
          className="h-12 rounded-xl bg-rose-600 text-sm font-bold text-white"
        >
          איפוס כל הנתונים
        </button>
      </section>
    </main>
  );
}
