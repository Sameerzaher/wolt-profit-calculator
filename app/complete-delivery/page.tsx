"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuickInputField from "@/components/QuickInputField";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import type { DeliveryCompletionInput } from "@/types/models";

export default function CompleteDeliveryPage() {
  const router = useRouter();
  const { activeDelivery, completeActiveDelivery } = useAppData();
  const [form, setForm] = useState<DeliveryCompletionInput>({
    actualAmount: activeDelivery?.offerAmount ?? 0,
    tipCash: 0,
    actualKm: activeDelivery?.estimatedKm ?? 0,
    actualMinutes: activeDelivery?.estimatedMinutes ?? 0,
    restaurantDelay: false,
    dropoffDemandQuality: "medium",
    deliveryRating: "ok",
    notes: ""
  });

  if (!activeDelivery) {
    return <p className="text-slate-400">אין משלוח פעיל לסיום.</p>;
  }

  return (
    <main className="space-y-4">
      <ScreenHeader title="סיום משלוח" subtitle="תיעוד ביצוע בפועל לניתוח רווחיות אמיתי" />

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <QuickInputField
          label="סכום בפועל (₪)"
          type="number"
          value={form.actualAmount}
          onChange={(value) => setForm({ ...form, actualAmount: Number(value) || 0 })}
        />
        <QuickInputField
          label="טיפ מזומן"
          type="number"
          value={form.tipCash}
          onChange={(value) => setForm({ ...form, tipCash: Number(value) || 0 })}
        />
        <QuickInputField
          label="ק״מ בפועל"
          type="number"
          value={form.actualKm}
          onChange={(value) => setForm({ ...form, actualKm: Number(value) || 0 })}
        />
        <QuickInputField
          label="דקות בפועל"
          type="number"
          value={form.actualMinutes}
          onChange={(value) => setForm({ ...form, actualMinutes: Number(value) || 0 })}
        />

        <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.restaurantDelay}
            onChange={(event) => setForm({ ...form, restaurantDelay: event.target.checked })}
          />
          עיכוב במסעדה
        </label>

        <label className="block text-sm text-slate-300">
          איכות ביקוש באזור מסירה
          <select
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
            value={form.dropoffDemandQuality}
            onChange={(event) =>
              setForm({ ...form, dropoffDemandQuality: event.target.value as DeliveryCompletionInput["dropoffDemandQuality"] })
            }
          >
            <option value="good">טוב</option>
            <option value="medium">בינוני</option>
            <option value="bad">חלש</option>
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          דירוג משלוח
          <select
            className="mt-1 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
            value={form.deliveryRating}
            onChange={(event) =>
              setForm({ ...form, deliveryRating: event.target.value as DeliveryCompletionInput["deliveryRating"] })
            }
          >
            <option value="good">טוב</option>
            <option value="ok">סביר</option>
            <option value="bad">חלש</option>
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          הערות
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
          />
        </label>
      </section>

      <button
        type="button"
        className="h-14 w-full rounded-2xl bg-emerald-500 text-lg font-black text-slate-950"
        onClick={() => {
          completeActiveDelivery(form);
          router.push("/shift-stats");
        }}
      >
        שמור סיום משלוח
      </button>
    </main>
  );
}
