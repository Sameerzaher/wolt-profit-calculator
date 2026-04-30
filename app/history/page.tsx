"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { deleteShiftAnalysisByDate, listAllShiftAnalyses } from "@/lib/storage";
import type { ScreenshotAnalysisSnapshot } from "@/types/models";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScreenshotAnalysisSnapshot[]>([]);

  useEffect(() => {
    setItems(listAllShiftAnalyses());
  }, []);

  const hasItems = items.length > 0;
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.shiftDate.localeCompare(a.shiftDate)),
    [items]
  );

  const onDelete = (shiftDate: string) => {
    deleteShiftAnalysisByDate(shiftDate);
    setItems((prev) => prev.filter((item) => item.shiftDate !== shiftDate));
  };

  return (
    <main className="space-y-4">
      <ScreenHeader title="היסטוריית ניתוחים" subtitle="כל משמרת שניתחת מצילומי מסך" />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/screenshot-analyzer"
            className="flex min-h-[2.8rem] items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-200"
          >
            ניתוח חדש
          </Link>
          <Link
            href="/monthly"
            className="flex min-h-[2.8rem] items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-sm font-bold text-slate-200"
          >
            סיכום חודשי/שבועי
          </Link>
        </div>
      </section>

      {!hasItems ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
          אין עדיין ניתוחים שמורים. העלה צילומים ב-`Screenshot Analyzer` כדי להתחיל.
        </section>
      ) : (
        <section className="space-y-3">
          {sortedItems.map((item) => (
            <article
              key={item.shiftDate}
              onClick={() => router.push(`/screenshot-analyzer?date=${item.shiftDate}`)}
              className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{item.shiftDate}</p>
                  <p className="text-xs text-slate-400">
                    משימות: {item.analysis.taskCount} | משלוחים: {item.analysis.deliveryCount} | מספר מקטעים: {item.sessions?.length ?? 0}
                  </p>
                </div>
                <p className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-200">
                  {item.analysis.rating}/10
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
                <p>ברוטו: ₪{item.analysis.grossIncome.toFixed(2)}</p>
                <p>נטו: {item.analysis.estimatedNetIncome !== undefined ? `₪${item.analysis.estimatedNetIncome.toFixed(2)}` : "-"}</p>
                <p>שעות: {item.analysis.activeWorkHours?.toFixed(2) ?? item.analysis.estimatedDurationHours?.toFixed(2) ?? "-"}</p>
                <p>ק״מ: {item.actualDrivenKm ?? item.analysis.totalOfferKm}</p>
                <p>₪/שעה: {item.analysis.grossPerHour !== undefined ? `₪${item.analysis.grossPerHour.toFixed(2)}` : "-"}</p>
                <p>₪/ק״מ: {item.analysis.grossPerKm !== undefined ? `₪${item.analysis.grossPerKm.toFixed(2)}` : "-"}</p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2" onClick={(event) => event.stopPropagation()}>
                <Link
                  href={`/screenshot-analyzer?date=${item.shiftDate}`}
                  className="flex min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-xs font-bold text-slate-200"
                >
                  פתח משמרת
                </Link>
                <Link
                  href={`/screenshot-analyzer?date=${item.shiftDate}`}
                  className="flex min-h-[2.5rem] items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-200"
                >
                  ערוך
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(item.shiftDate)}
                  className="min-h-[2.5rem] rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-100"
                >
                  מחק
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
