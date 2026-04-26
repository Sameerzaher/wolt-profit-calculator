"use client";

import { useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import ScoreBadge from "@/components/ScoreBadge";
import { useAppData } from "@/components/AppDataProvider";
import { deliveryZones } from "@/data/zones";
import { filterDeliveries, type HistoryFilter } from "@/features/orders/history";

export default function HistoryPage() {
  const { deliveries } = useAppData();
  const [filter, setFilter] = useState<HistoryFilter>("today");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const items = useMemo(() => filterDeliveries(deliveries, filter, zoneFilter), [deliveries, filter, zoneFilter]);
  const zoneOptions = [...deliveryZones.haifa, ...deliveryZones.krayot, ...deliveryZones.nearby];

  return (
    <main className="space-y-4">
      <ScreenHeader title="היסטוריית משלוחים" subtitle="מה עבד טוב ומה בזבז לך זמן" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "today", label: "היום" },
            { id: "week", label: "שבוע" },
            { id: "bad", label: "חלשים" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as HistoryFilter)}
              className={`min-h-[2.8rem] rounded-xl border text-sm font-bold ${
                filter === item.id
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={zoneFilter}
          onChange={(event) => setZoneFilter(event.target.value)}
          className="mt-3 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
        >
          <option value="all">כל האזורים</option>
          <option value="haifa">חיפה</option>
          <option value="krayot">קריות</option>
          <option value="nearby">אזורים קרובים</option>
          {zoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        {items.map((delivery) => (
          <article key={delivery.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  {delivery.pickupZone} ← {delivery.dropoffZone}
                </p>
                <p className="text-xs text-slate-400">{new Date(delivery.acceptedAt).toLocaleString("he-IL")}</p>
              </div>
              <ScoreBadge decision={delivery.quickCheckResult.decision} score={delivery.quickCheckResult.score} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <p>₪ {delivery.completion?.actualAmount ?? delivery.offerAmount}</p>
              <p>{delivery.completion?.actualKm ?? delivery.estimatedKm} ק״מ</p>
              <p>{delivery.completion?.actualMinutes ?? delivery.estimatedMinutes} דק׳</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
