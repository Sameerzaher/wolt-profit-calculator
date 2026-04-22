"use client";

import Link from "next/link";
import DeliveryTimerCard from "@/components/DeliveryTimerCard";
import ScreenHeader from "@/components/ScreenHeader";
import ScoreBadge from "@/components/ScoreBadge";
import { useAppData } from "@/components/AppDataProvider";

export default function ActiveDeliveryPage() {
  const { activeDelivery, markPickedUp, markDelivered } = useAppData();

  if (!activeDelivery) {
    return (
      <main className="space-y-4">
        <ScreenHeader title="משלוח פעיל" subtitle="אין משלוח פעיל כרגע" />
        <Link href="/quick-check" className="block rounded-xl bg-emerald-500 px-4 py-3 text-center font-bold text-slate-950">
          לפתוח בדיקה מהירה
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-4 pb-40">
      <ScreenHeader title="משלוח פעיל" subtitle="טיימר ולחצני סטטוס בזמן נהיגה" />
      <DeliveryTimerCard acceptedAt={activeDelivery.acceptedAt} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-white">{activeDelivery.pickupZone} ← {activeDelivery.dropoffZone}</p>
          <ScoreBadge decision={activeDelivery.quickCheckResult.decision} score={activeDelivery.quickCheckResult.score} />
        </div>
        <p className="mt-2 text-sm text-slate-400">התקבל: {new Date(activeDelivery.acceptedAt).toLocaleTimeString("he-IL")}</p>
        <p className="text-sm text-slate-400">סכום הצעה: ₪{activeDelivery.offerAmount.toFixed(1)}</p>
      </section>

      <section className="fixed inset-x-0 bottom-[4.6rem] z-20 px-3">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 backdrop-blur">
          <button
            type="button"
            onClick={markPickedUp}
            className="min-h-[3.6rem] rounded-xl border border-sky-500/40 bg-sky-500/15 text-sm font-black text-sky-100 active:scale-[0.98]"
          >
            נאסף
          </button>
          <button
            type="button"
            onClick={markDelivered}
            className="min-h-[3.6rem] rounded-xl border border-violet-500/40 bg-violet-500/15 text-sm font-black text-violet-100 active:scale-[0.98]"
          >
            נמסר
          </button>
          <Link
            href="/complete-delivery"
            className="flex min-h-[3.6rem] items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/40 active:scale-[0.98]"
          >
            סיום
          </Link>
        </div>
      </section>
    </main>
  );
}
