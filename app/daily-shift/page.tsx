"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import DayTotalsCard from "@/components/shift/DayTotalsCard";
import PlatformComparisonCard from "@/components/shift/PlatformComparisonCard";
import ShiftSegmentCard from "@/components/shift/ShiftSegmentCard";
import { useAppData } from "@/components/AppDataProvider";
import { analyzeDayShift, createEmptySegment, validateShiftSegments } from "@/src/lib/shiftSegments";
import { getTodayDateInput } from "@/src/lib/dateTime";
import type { DayShiftRecord, DeliveryPlatform, ShiftSegment } from "@/types/models";

export default function DailyShiftPage() {
  const { fuelSettings, dayShifts, saveDayShift, isHydrated } = useAppData();
  const today = getTodayDateInput();
  const [shiftDate, setShiftDate] = useState(today);
  const [segments, setSegments] = useState<ShiftSegment[]>([]);
  const [costPerKm, setCostPerKm] = useState(String(fuelSettings.costPerKm));
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("date");
      if (fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl)) {
        setShiftDate(fromUrl);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const existing = dayShifts.find((record) => record.shiftDate === shiftDate);
    if (existing) {
      setSegments(existing.segments);
      setCostPerKm(String(existing.costPerKm));
    } else {
      setSegments([]);
      setCostPerKm(String(fuelSettings.costPerKm));
    }
  }, [shiftDate, dayShifts, fuelSettings.costPerKm, isHydrated]);

  const costPerKmValue = toNumber(costPerKm) ?? fuelSettings.costPerKm;
  const draftRecord: DayShiftRecord = useMemo(
    () => ({
      shiftDate,
      segments,
      costPerKm: costPerKmValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1
    }),
    [shiftDate, segments, costPerKmValue]
  );

  const analysis = useMemo(() => analyzeDayShift(draftRecord), [draftRecord]);
  const issues = useMemo(() => validateShiftSegments(segments), [segments]);

  const addSegment = (platform: DeliveryPlatform = "wolt") => {
    setSegments((prev) => [...prev, createEmptySegment(platform)]);
  };

  const updateSegment = (id: string, patch: Partial<ShiftSegment>) => {
    setSegments((prev) => prev.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)));
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((segment) => segment.id !== id));
  };

  const persist = () => {
    if (segments.length === 0) return;
    const existing = dayShifts.find((record) => record.shiftDate === shiftDate);
    const record: DayShiftRecord = {
      shiftDate,
      segments,
      costPerKm: costPerKmValue,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1
    };
    saveDayShift(record);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <main className="app-page">
      <ScreenHeader
        title="משמרת יומית"
        subtitle="Wolt · HaAt · Ten Bis — מקטעים, רווח נטו והשוואת פלטפורמות"
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <label className="mb-2 block text-sm font-bold text-slate-200">תאריך</label>
        <input
          type="date"
          value={shiftDate}
          max={today}
          onChange={(event) => setShiftDate(event.target.value || today)}
          className="date-input h-11 rounded-xl"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-400">
            עלות לק״מ (דלק)
            <input
              type="number"
              inputMode="decimal"
              value={costPerKm}
              onChange={(event) => setCostPerKm(event.target.value)}
              className="field-input mt-1"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={persist}
              disabled={segments.length === 0}
              className="h-10 w-full rounded-xl bg-emerald-500 text-sm font-black text-slate-950 disabled:opacity-50"
            >
              {savedFlash ? "נשמר ✓" : "שמור יום"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-200">מקטעי עבודה</p>
          <button
            type="button"
            onClick={() => addSegment("wolt")}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200"
          >
            + מקטע
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          הוסיפו מקטע לכל יציאה לכביש — גם אם עברתם בין Wolt, HaAt ו-Ten Bis באותו יום.
        </p>

        {segments.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-sm text-slate-400">
            <p>אין מקטעים עדיין</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <QuickAdd label="Wolt" onClick={() => addSegment("wolt")} />
              <QuickAdd label="HaAt" onClick={() => addSegment("haat")} />
              <QuickAdd label="Ten Bis" onClick={() => addSegment("tenbis")} />
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {segments.map((segment, index) => {
              const metrics = analysis.segments.find((row) => row.segmentId === segment.id);
              if (!metrics) return null;
              return (
                <ShiftSegmentCard
                  key={segment.id}
                  index={index}
                  segment={segment}
                  metrics={metrics}
                  onChange={(patch) => updateSegment(segment.id, patch)}
                  onRemove={() => removeSegment(segment.id)}
                />
              );
            })}
          </div>
        )}

        {issues.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
            {issues.map((issue) => (
              <p key={issue}>- {issue}</p>
            ))}
          </div>
        ) : null}
      </section>

      {segments.length > 0 ? (
        <>
          <DayTotalsCard totals={analysis.totals} />
          <PlatformComparisonCard comparison={analysis.comparison} byPlatform={analysis.byPlatform} />
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-xs text-slate-400">
        <p className="font-bold text-slate-200">עדיין משתמשים ב-Wolt בלבד?</p>
        <p className="mt-1">ניתוח צילומי מסך נשאר זמין — הנתונים הישנים הועברו אוטומטית לכאן.</p>
        <Link href="/screenshot-analyzer" className="mt-2 inline-block font-bold text-emerald-300">
          מעבר לניתוח צילומים →
        </Link>
      </section>
    </main>
  );
}

function QuickAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
    >
      + {label}
    </button>
  );
}

function toNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

