"use client";

import Link from "next/link";
import ScreenHeader from "@/components/ScreenHeader";

export default function ActiveDeliveryPage() {
  return (
    <main className="space-y-4">
      <ScreenHeader title="מצב שליח" subtitle="המסך הועבר למצב משמרת פעילה" />
      <Link href="/active-shift" className="block rounded-xl bg-emerald-500 px-4 py-3 text-center font-bold text-slate-950">
        עבור למסך משמרת פעילה
      </Link>
    </main>
  );
}
