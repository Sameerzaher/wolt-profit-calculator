"use client";

import ScreenHeader from "@/components/ScreenHeader";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/components/AppDataProvider";
import { calculateWeeklyInsights } from "@/lib/analytics";
import { calculateFuelCost } from "@/lib/scoring";
import { isBadOrder } from "@/features/orders/history";

export default function InsightsPage() {
  const { deliveries, fuelSettings } = useAppData();
  const insights = calculateWeeklyInsights(deliveries);
  const completed = deliveries.filter((delivery) => delivery.status === "completed");
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, delivery) => sum + delivery.quickCheckResult.score, 0) / completed.length
      : 0;
  const netAfterFuel = completed.reduce(
    (sum, delivery) =>
      sum +
      ((delivery.completion?.actualAmount ?? 0) + (delivery.completion?.tipCash ?? 0) - calculateFuelCost(delivery.completion?.actualKm ?? delivery.estimatedKm, fuelSettings)),
    0
  );
  const worstOrders = completed.filter(isBadOrder).slice(0, 5);

  return (
    <main className="space-y-4">
      <ScreenHeader title="תובנות חכמות" subtitle="איפה להרוויח יותר ואיפה נשרף זמן" />
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="האזור הכי טוב היום" value={insights.bestDropoffZone} />
        <StatCard label="האזור הכי טוב השבוע" value={insights.bestZone} />
        <StatCard label="טווח שעה חזק" value={insights.bestHourRange} />
        <StatCard label="ממוצע ₪/שעה" value={insights.averageIlsPerHour} />
        <StatCard label="ממוצע ציון" value={avgScore} />
        <StatCard label="נטו אחרי דלק" value={netAfterFuel} asMoney />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-bold text-white">משלוחים מבזבזים</h3>
        <div className="mt-3 space-y-2">
          {worstOrders.length === 0 ? (
            <p className="text-sm text-slate-400">אין כרגע משלוחים חלשים.</p>
          ) : (
            worstOrders.map((delivery) => (
              <article key={delivery.id} className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
                <p className="font-bold text-rose-100">
                  {delivery.pickupZone} ← {delivery.dropoffZone}
                </p>
                <p className="text-rose-200/80">{delivery.quickCheckResult.explanation}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
