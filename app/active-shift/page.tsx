"use client";

import Link from "next/link";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { isBadOrder } from "@/features/orders/history";
import { calculateActiveShiftSnapshot } from "@/features/shifts/momentum";

export default function ActiveShiftPage() {
  const { deliveries, shifts, fuelSettings, appSettings, endShift } = useAppData();
  const shift = calculateActiveShiftSnapshot(deliveries, shifts, fuelSettings, appSettings.dailyTarget, appSettings.activeShiftId);
  const wastedOrdersToday = deliveries.filter(
    (delivery) => delivery.status === "completed" && new Date(delivery.acceptedAt).toDateString() === new Date().toDateString() && isBadOrder(delivery)
  ).length;

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
