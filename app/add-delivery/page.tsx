"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuickInputField from "@/components/QuickInputField";
import ScreenHeader from "@/components/ScreenHeader";
import ZoneChipSelector from "@/components/ZoneChipSelector";
import { useAppData } from "@/components/AppDataProvider";
import { deliveryZones, getZonesByRegion, type ZoneRegion } from "@/data/zones";
import type { DeliveryCompletionInput, QuickCheckInput } from "@/types/models";

export default function AddDeliveryPage() {
  const router = useRouter();
  const { addManualCompletedDelivery } = useAppData();
  const [pickupRegion, setPickupRegion] = useState<ZoneRegion>("haifa");
  const [dropoffRegion, setDropoffRegion] = useState<ZoneRegion>("haifa");
  const [order, setOrder] = useState<QuickCheckInput>({
    offerAmount: 30,
    estimatedKm: 4,
    estimatedMinutes: 24,
    pickupZone: deliveryZones.haifa[0],
    dropoffZone: deliveryZones.haifa[0],
    timeOfDay: "ערב",
    weatherBonus: false,
    trafficLevel: "medium",
    hardParking: false
  });
  const [completion, setCompletion] = useState<DeliveryCompletionInput>({
    actualAmount: 30,
    tipCash: 0,
    actualKm: 4,
    actualMinutes: 24,
    restaurantDelay: false,
    dropoffDemandQuality: "medium",
    deliveryRating: "ok",
    notes: ""
  });

  return (
    <main className="space-y-4 pb-36">
      <ScreenHeader title="הוסף משלוח ידני" subtitle="לשמירה מהירה של הזמנות שבוצעו" />
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-3 gap-2">
          <QuickInputField
            label="סכום"
            type="number"
            value={order.offerAmount}
            onChange={(value) => {
              const numeric = Number(value) || 0;
              setOrder({ ...order, offerAmount: numeric });
              setCompletion({ ...completion, actualAmount: numeric });
            }}
          />
          <QuickInputField
            label="ק״מ"
            type="number"
            value={order.estimatedKm}
            onChange={(value) => {
              const numeric = Number(value) || 0;
              setOrder({ ...order, estimatedKm: numeric });
              setCompletion({ ...completion, actualKm: numeric });
            }}
          />
          <QuickInputField
            label="דקות"
            type="number"
            value={order.estimatedMinutes}
            onChange={(value) => {
              const numeric = Number(value) || 0;
              setOrder({ ...order, estimatedMinutes: numeric });
              setCompletion({ ...completion, actualMinutes: numeric });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-h-[3rem] rounded-xl border border-slate-700 bg-slate-950 text-sm font-bold text-white"
            onClick={() => setOrder({ ...order, trafficLevel: "low" })}
          >
            תנועה נמוכה
          </button>
          <button
            type="button"
            className="min-h-[3rem] rounded-xl border border-slate-700 bg-slate-950 text-sm font-bold text-white"
            onClick={() => setOrder({ ...order, hardParking: !order.hardParking })}
          >
            חניה קשה {order.hardParking ? "✓" : "—"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${pickupRegion === "haifa" ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}
            onClick={() => {
              setPickupRegion("haifa");
              setOrder({ ...order, pickupZone: deliveryZones.haifa[0] });
            }}
          >
            איסוף חיפה
          </button>
          <button
            type="button"
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${pickupRegion === "krayot" ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}
            onClick={() => {
              setPickupRegion("krayot");
              setOrder({ ...order, pickupZone: deliveryZones.krayot[0] });
            }}
          >
            איסוף קריות
          </button>
        </div>
        <ZoneChipSelector label="אזור איסוף" options={getZonesByRegion(pickupRegion)} value={order.pickupZone} onChange={(pickupZone) => setOrder({ ...order, pickupZone })} />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${dropoffRegion === "haifa" ? "border-sky-500/60 bg-sky-500/20 text-sky-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}
            onClick={() => {
              setDropoffRegion("haifa");
              setOrder({ ...order, dropoffZone: deliveryZones.haifa[0] });
            }}
          >
            מסירה חיפה
          </button>
          <button
            type="button"
            className={`min-h-[3rem] rounded-xl border text-sm font-bold ${dropoffRegion === "krayot" ? "border-sky-500/60 bg-sky-500/20 text-sky-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}
            onClick={() => {
              setDropoffRegion("krayot");
              setOrder({ ...order, dropoffZone: deliveryZones.krayot[0] });
            }}
          >
            מסירה קריות
          </button>
        </div>
        <ZoneChipSelector label="אזור מסירה" options={getZonesByRegion(dropoffRegion)} value={order.dropoffZone} onChange={(dropoffZone) => setOrder({ ...order, dropoffZone })} />
      </section>

      <button
        type="button"
        className="fixed bottom-[4.7rem] left-3 right-3 mx-auto max-w-lg min-h-[3.5rem] rounded-xl bg-emerald-500 text-base font-black text-slate-950"
        onClick={() => {
          addManualCompletedDelivery(order, completion);
          router.push("/active-shift");
        }}
      >
        שמור משלוח
      </button>
    </main>
  );
}
