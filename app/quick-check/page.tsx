"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuickInputField from "@/components/QuickInputField";
import ScoreBadge from "@/components/ScoreBadge";
import ScreenHeader from "@/components/ScreenHeader";
import ZoneChipSelector from "@/components/ZoneChipSelector";
import { useAppData } from "@/components/AppDataProvider";
import { REGION_LABELS, deliveryZones, getZonesByRegion, type ZoneRegion } from "@/src/data/zones";
import type { QuickCheckInput } from "@/types/models";

const TIME_PRESETS = ["בוקר", "צהריים", "ערב", "לילה"];
const OFFER_PRESETS = [24, 30, 36, 42];
const KM_PRESETS = [2.5, 3.5, 4.5, 6];
const MIN_PRESETS = [16, 22, 28, 36];
const REGIONS: ZoneRegion[] = ["haifa", "krayot", "nearby"];

const initialState: QuickCheckInput = {
  offerAmount: 32,
  estimatedKm: 3.8,
  estimatedMinutes: 24,
  pickupZone: "חיפה מרכז",
  dropoffZone: "מת״מ",
  timeOfDay: "ערב",
  weatherBonus: false,
  trafficLevel: "medium",
  hardParking: false
};

export default function QuickCheckPage() {
  const router = useRouter();
  const { runQuickCheck, acceptQuickCheck } = useAppData();
  const [form, setForm] = useState<QuickCheckInput>(initialState);
  const [pickupRegion, setPickupRegion] = useState<ZoneRegion>("haifa");
  const [dropoffRegion, setDropoffRegion] = useState<ZoneRegion>("haifa");

  const result = useMemo(() => runQuickCheck(form), [form, runQuickCheck]);
  const feedbackStyle =
    result.decision === "accept"
      ? "border-emerald-500/60 bg-emerald-500/12"
      : result.decision === "borderline"
        ? "border-amber-500/60 bg-amber-500/12"
        : "border-rose-500/60 bg-rose-500/12";

  return (
    <main className="space-y-4 pb-40">
      <ScreenHeader title="בדיקה מהירה (3 שניות)" subtitle="חיפה + קריות | בחירה טקטית בלחיצה אחת" />

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-300">סכום הצעה מהיר</p>
          <div className="grid grid-cols-4 gap-2">
            {OFFER_PRESETS.map((offer) => (
              <button
                key={offer}
                type="button"
                onClick={() => setForm({ ...form, offerAmount: offer })}
                className={`min-h-[3rem] rounded-xl border text-sm font-black ${
                  form.offerAmount === offer
                    ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                    : "border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                ₪{offer}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-2.5">
            <p className="mb-2 text-sm font-semibold text-slate-300">ק״מ משוער</p>
            <div className="grid grid-cols-2 gap-2">
              {KM_PRESETS.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setForm({ ...form, estimatedKm: km })}
                  className={`min-h-[2.9rem] rounded-xl border text-sm font-bold ${
                    form.estimatedKm === km
                      ? "border-sky-400 bg-sky-500/25 text-sky-100"
                      : "border-slate-700 bg-slate-950 text-slate-200"
                  }`}
                >
                  {km} ק״מ
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-2.5">
            <p className="mb-2 text-sm font-semibold text-slate-300">זמן משוער</p>
            <div className="grid grid-cols-2 gap-2">
              {MIN_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setForm({ ...form, estimatedMinutes: minutes })}
                  className={`min-h-[2.9rem] rounded-xl border text-sm font-bold ${
                    form.estimatedMinutes === minutes
                      ? "border-violet-400 bg-violet-500/25 text-violet-100"
                      : "border-slate-700 bg-slate-950 text-slate-200"
                  }`}
                >
                  {minutes} דק׳
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <p className="text-sm font-bold text-slate-300">שלב 1: אזור איסוף</p>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => {
                  setPickupRegion(region);
                  setForm({ ...form, pickupZone: deliveryZones[region][0] });
                }}
                className={`min-h-[3.1rem] rounded-xl border text-sm font-black ${
                  pickupRegion === region
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                {REGION_LABELS[region]}
              </button>
            ))}
          </div>
          <ZoneChipSelector
            label="שלב 2: שכונת/אזור איסוף"
            options={getZonesByRegion(pickupRegion)}
            value={form.pickupZone}
            onChange={(pickupZone) => setForm({ ...form, pickupZone })}
          />
        </div>

        <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <p className="text-sm font-bold text-slate-300">שלב 1: אזור מסירה</p>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => {
                  setDropoffRegion(region);
                  setForm({ ...form, dropoffZone: deliveryZones[region][0] });
                }}
                className={`min-h-[3.1rem] rounded-xl border text-sm font-black ${
                  dropoffRegion === region
                    ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100"
                    : "border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                {REGION_LABELS[region]}
              </button>
            ))}
          </div>
          <ZoneChipSelector
            label="שלב 2: שכונת/אזור מסירה"
            options={getZonesByRegion(dropoffRegion)}
            value={form.dropoffZone}
            onChange={(dropoffZone) => setForm({ ...form, dropoffZone })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickInputField label="₪ ידני" type="number" value={form.offerAmount} onChange={(value) => setForm({ ...form, offerAmount: Number(value) || 0 })} />
          <QuickInputField label="ק״מ ידני" type="number" value={form.estimatedKm} onChange={(value) => setForm({ ...form, estimatedKm: Number(value) || 0 })} />
          <div className="col-span-2">
            <QuickInputField label="דקות ידני" type="number" value={form.estimatedMinutes} onChange={(value) => setForm({ ...form, estimatedMinutes: Number(value) || 0 })} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-300">שעה ביום</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_PRESETS.map((timeOfDay) => (
              <button
                key={timeOfDay}
                type="button"
                onClick={() => setForm({ ...form, timeOfDay })}
                className={`min-h-[2.8rem] rounded-xl border text-sm font-bold ${
                  form.timeOfDay === timeOfDay
                    ? "border-teal-400 bg-teal-500/20 text-teal-100"
                    : "border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                {timeOfDay}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-300">רמת תנועה</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "low", label: "נמוכה" },
              { key: "medium", label: "בינונית" },
              { key: "high", label: "גבוהה" }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setForm({ ...form, trafficLevel: item.key as QuickCheckInput["trafficLevel"] })}
                className={`min-h-[2.8rem] rounded-xl border text-sm font-bold ${
                  form.trafficLevel === item.key
                    ? "border-orange-400 bg-orange-500/20 text-orange-100"
                    : "border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, weatherBonus: !form.weatherBonus })}
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${
              form.weatherBonus ? "border-blue-400 bg-blue-500/25 text-blue-100" : "border-slate-700 bg-slate-950 text-slate-200"
            }`}
          >
            מזג אוויר {form.weatherBonus ? "✓" : "—"}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, hardParking: !form.hardParking })}
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${
              form.hardParking ? "border-rose-400 bg-rose-500/25 text-rose-100" : "border-slate-700 bg-slate-950 text-slate-200"
            }`}
          >
            חניה קשה {form.hardParking ? "✓" : "—"}
          </button>
        </div>
      </section>

      <section className={`rounded-2xl border p-4 shadow-lg shadow-black/20 ${feedbackStyle}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ScoreBadge decision={result.decision} score={result.score} />
          <p className="text-sm font-semibold text-slate-200">
            {result.decisionLabel} | ₪/שעה: {result.estimatedIlsPerHour.toFixed(1)}
          </p>
        </div>
        <p className="mt-3 text-sm text-slate-200">רווח נקי משוער: ₪{result.estimatedNetProfit.toFixed(1)}</p>
        <p className="mt-1 text-sm text-slate-300">{result.explanation}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {result.isStrongDestination && (
            <span className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-2 py-1 text-emerald-200">יעד חזק</span>
          )}
          {result.isWeakDestination && (
            <span className="rounded-full border border-rose-500/50 bg-rose-500/20 px-2 py-1 text-rose-200">יעד חלש</span>
          )}
          {result.isPeakTime && (
            <span className="rounded-full border border-sky-500/50 bg-sky-500/20 px-2 py-1 text-sky-200">שעת שיא</span>
          )}
          {result.isCrossRegion && (
            <span className="rounded-full border border-amber-500/50 bg-amber-500/20 px-2 py-1 text-amber-200">מעבר אזור</span>
          )}
          {result.throwsOutOfHotZone && (
            <span className="rounded-full border border-rose-500/50 bg-rose-500/20 px-2 py-1 text-rose-200">יציאה מאזור חם</span>
          )}
        </div>
      </section>

      <section className="fixed inset-x-0 bottom-[4.6rem] z-20 px-3">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setForm(initialState);
              setPickupRegion("haifa");
              setDropoffRegion("haifa");
            }}
            className="min-h-[3.65rem] rounded-xl border border-slate-600 bg-slate-900 text-base font-black text-slate-200 active:scale-[0.98]"
          >
            איפוס מהיר
          </button>
          <button
            type="button"
            onClick={() => {
              acceptQuickCheck(form);
              router.push("/active-delivery");
            }}
            className="min-h-[3.65rem] rounded-xl bg-emerald-500 text-base font-black text-slate-950 shadow-lg shadow-emerald-950/50 active:scale-[0.98]"
          >
            קבל והתחל
          </button>
        </div>
      </section>
    </main>
  );
}
