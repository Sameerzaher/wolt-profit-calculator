"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { isBadOrder } from "@/features/orders/history";
import { calculateActiveShiftSnapshot } from "@/features/shifts/momentum";
import { summarizeShiftSessions, validateShiftSessions } from "@/features/shifts/sessions";
import type { ShiftSession } from "@/types/models";

export default function ActiveShiftPage() {
  const { deliveries, shifts, fuelSettings, appSettings, endShift, updateActiveShiftExpenses, updateActiveShiftSessions } = useAppData();
  const shift = calculateActiveShiftSnapshot(deliveries, shifts, fuelSettings, appSettings.dailyTarget, appSettings.activeShiftId);
  const activeShift = useMemo(
    () => shifts.find((entry) => entry.id === appSettings.activeShiftId) ?? shifts.find((entry) => !entry.endedAt),
    [appSettings.activeShiftId, shifts]
  );
  const [sessions, setSessions] = useState<ShiftSession[]>([]);
  const [actualKmInput, setActualKmInput] = useState("");
  const [costPerKmInput, setCostPerKmInput] = useState("0.7");

  useEffect(() => {
    setSessions(activeShift?.sessions ?? []);
    setActualKmInput(activeShift?.actualDrivenKm !== undefined ? String(activeShift.actualDrivenKm) : "");
    setCostPerKmInput(String(activeShift?.costPerKm ?? 0.7));
  }, [activeShift?.actualDrivenKm, activeShift?.costPerKm, activeShift?.id, activeShift?.sessions]);

  const actualKm = toOptionalNumber(actualKmInput);
  const costPerKm = toOptionalNumber(costPerKmInput) ?? 0.7;
  const sessionSummary = useMemo(() => summarizeShiftSessions(sessions), [sessions]);
  const sessionIssues = useMemo(() => validateShiftSessions(sessions), [sessions]);
  const activeWorkHours = sessionSummary.activeWorkHours ?? (shift.runningMinutes > 0 ? shift.runningMinutes / 60 : 0);
  const grossIncome = shift.incomeSoFar;
  const vehicleCost = actualKm !== undefined ? actualKm * costPerKm : 0;
  const netIncome = grossIncome - vehicleCost;
  const grossPerHour = activeWorkHours > 0 ? grossIncome / activeWorkHours : 0;
  const netPerHour = activeWorkHours > 0 ? netIncome / activeWorkHours : 0;
  const grossPerKm = actualKm && actualKm > 0 ? grossIncome / actualKm : 0;
  const netToneClass = netPerHour > 60 ? "text-emerald-300" : netPerHour >= 40 ? "text-amber-300" : "text-rose-300";
  const canUseSessionHours = sessionSummary.activeWorkHours !== undefined;

  const wastedOrdersToday = deliveries.filter(
    (delivery) => delivery.status === "completed" && new Date(delivery.acceptedAt).toDateString() === new Date().toDateString() && isBadOrder(delivery)
  ).length;

  const onAddSession = () => {
    const next = [
      ...sessions,
      {
        id: crypto.randomUUID(),
        startTime: "13:00",
        endTime: "15:00",
        isNextDay: false
      }
    ];
    setSessions(next);
    if (activeShift) updateActiveShiftSessions(next);
  };

  const onUpdateSession = (id: string, patch: Partial<ShiftSession>) => {
    const next = sessions.map((session) => (session.id === id ? { ...session, ...patch } : session));
    setSessions(next);
    if (activeShift) updateActiveShiftSessions(next);
  };

  const onRemoveSession = (id: string) => {
    const next = sessions.filter((session) => session.id !== id);
    setSessions(next);
    if (activeShift) updateActiveShiftSessions(next);
  };

  return (
    <main className="space-y-4 pb-40">
      <ScreenHeader title="מצב משמרת פעילה" subtitle="בקרה חיה בזמן אמת מתוך הרכב" />

      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">טיימר רץ</p>
          <p className="mt-1 text-2xl font-black text-white">{(shift.runningMinutes / 60).toFixed(2)} שעות</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">הכנסה עד עכשיו</p>
          <p className="mt-1 text-2xl font-black text-emerald-300">₪{shift.incomeSoFar.toFixed(0)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">₪ לשעה</p>
          <p className="mt-1 text-2xl font-black text-sky-300">{shift.hourlyRate.toFixed(1)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">משלוחים</p>
          <p className="mt-1 text-2xl font-black text-white">{shift.deliveriesCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">דלק משוער: ₪{shift.estimatedFuelCost.toFixed(1)}</p>
        <p className="text-sm text-slate-300">רווח נקי: ₪{shift.netProfit.toFixed(1)}</p>
        <p className="mt-2 text-sm font-bold text-white">{shift.momentumLabel}</p>
        <p className="text-xs text-amber-300">משלוחים חלשים היום: {wastedOrdersToday}</p>
        <p className="text-xs text-slate-400">
          חסרים ₪{shift.targetRemaining.toFixed(0)} | עוד בערך {shift.missingHoursToTarget.toFixed(1)} שעות ליעד
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-200">מקטעי עבודה</p>
          <button
            type="button"
            onClick={onAddSession}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200"
          >
            הוסף מקטע עבודה
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">לא הוגדרו מקטעים עדיין.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {sessions.map((session, index) => (
              <article key={session.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">מקטע {index + 1}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">תחילת מקטע</p>
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(event) => onUpdateSession(session.id, { startTime: event.target.value })}
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">סיום מקטע</p>
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(event) => onUpdateSession(session.id, { endTime: event.target.value })}
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={session.isNextDay}
                      onChange={(event) => onUpdateSession(session.id, { isNextDay: event.target.checked })}
                    />
                    מסתיים ביום הבא
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveSession(session.id)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-100"
                  >
                    הסר
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <p className="rounded-lg bg-slate-950 px-2 py-2 text-slate-300">סה״כ זמן עבודה: {formatHours(sessionSummary.activeWorkHours)}</p>
          <p className="rounded-lg bg-slate-950 px-2 py-2 text-slate-300">סה״כ זמן הפסקה: {formatHours(sessionSummary.breakHours)}</p>
        </div>
        {sessionIssues.length > 0 ? (
          <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
            {sessionIssues.map((issue) => (
              <p key={issue}>- {issue}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-slate-200">רווח נטו</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">ק״מ אמיתי</label>
            <input
              type="number"
              inputMode="decimal"
              value={actualKmInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setActualKmInput(nextValue);
                if (!activeShift) return;
                updateActiveShiftExpenses({
                  actualDrivenKm: toOptionalNumber(nextValue),
                  costPerKm
                });
              }}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">עלות לק״מ</label>
            <input
              type="number"
              inputMode="decimal"
              value={costPerKmInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setCostPerKmInput(nextValue);
                if (!activeShift) return;
                updateActiveShiftExpenses({
                  actualDrivenKm: actualKm,
                  costPerKm: toOptionalNumber(nextValue) ?? 0.7
                });
              }}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <StatLine label="Gross income" value={`₪${grossIncome.toFixed(1)}`} />
          <StatLine label="Vehicle cost" value={`₪${vehicleCost.toFixed(1)}`} />
          <StatLine label="רווח נטו" value={`₪${netIncome.toFixed(1)}`} />
          <StatLine label="Gross/hour" value={canUseSessionHours ? `₪${grossPerHour.toFixed(1)}` : "-"} />
          <StatLine label="רווח לשעה נטו" value={`₪${netPerHour.toFixed(1)}`} valueClassName={netToneClass} />
          <StatLine label="₪/km" value={actualKm && actualKm > 0 ? `₪${grossPerKm.toFixed(2)}` : "-"} />
        </div>
      </section>

      <section className="fixed inset-x-0 bottom-[4.6rem] z-20 px-3">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 backdrop-blur">
          <Link href="/quick-check" className="flex min-h-[3.6rem] items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950">
            בדוק משלוח
          </Link>
          <Link href="/add-delivery" className="flex min-h-[3.6rem] items-center justify-center rounded-xl border border-slate-600 bg-slate-900 text-sm font-black text-white">
            הוסף משלוח
          </Link>
          <button
            type="button"
            onClick={endShift}
            className="min-h-[3.6rem] rounded-xl border border-rose-500/40 bg-rose-500/20 text-sm font-black text-rose-100"
          >
            סיים משמרת
          </button>
        </div>
      </section>
    </main>
  );
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function StatLine({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black text-white ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function formatHours(value: number | undefined): string {
  if (value === undefined) return "-";
  return `${value.toFixed(2)} שעות`;
}
