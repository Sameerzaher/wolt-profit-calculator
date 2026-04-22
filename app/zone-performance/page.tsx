"use client";

import ScreenHeader from "@/components/ScreenHeader";
import ZoneStrengthBadge from "@/components/ZoneStrengthBadge";
import { useAppData } from "@/components/AppDataProvider";
import { calculateZonePerformance } from "@/lib/analytics";

export default function ZonePerformancePage() {
  const { deliveries } = useAppData();
  const zones = calculateZonePerformance(deliveries);

  return (
    <main className="space-y-4">
      <ScreenHeader title="ביצועי אזורים" subtitle="איכות רווחיות לפי אזור מסירה" />

      <section className="space-y-3">
        {zones.map((zone) => (
          <article key={zone.zone} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{zone.zone}</h3>
              <ZoneStrengthBadge strength={zone.strengthLabel} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
              <p>משלוחים: {zone.deliveryCount}</p>
              <p>ממוצע הכנסה: ₪{zone.avgIncome.toFixed(1)}</p>
              <p>ממוצע זמן: {zone.avgDuration.toFixed(1)} דק׳</p>
              <p>ממוצע ק״מ: {zone.avgKm.toFixed(1)}</p>
              <p>ממוצע ציון: {zone.avgScore.toFixed(1)}</p>
              <p>ביקוש המשך: {zone.followUpDemandQuality}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
