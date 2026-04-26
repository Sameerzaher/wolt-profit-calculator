"use client";

import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { getWhereToGoNow } from "@/features/insights/whereToGo";

export default function WhereToGoPage() {
  const { deliveries } = useAppData();
  const suggestion = getWhereToGoNow(deliveries);

  return (
    <main className="space-y-4">
      <ScreenHeader title="איפה כדאי עכשיו" subtitle="המלצה טקטית לפי שעה והיסטוריה" />

      <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
        <p className="text-xs text-emerald-200">המלצה חיה</p>
        <h2 className="mt-1 text-2xl font-black text-white">{suggestion.title}</h2>
        <p className="mt-2 text-sm text-slate-200">{suggestion.reason}</p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">יעד מוצע כרגע</p>
        <p className="mt-1 text-xl font-black text-sky-300">{suggestion.zone}</p>
      </section>
    </main>
  );
}
