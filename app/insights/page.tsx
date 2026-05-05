"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import ScreenHeader from "@/components/ScreenHeader";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/components/AppDataProvider";
import { calculateWeeklyInsights } from "@/lib/analytics";
import { calculatePerKm, calculateProfit } from "@/lib/calculations";
import { calculateFuelCost } from "@/lib/scoring";
import { calculateBreakMinutes, calculateWorkingMinutes } from "@/lib/shiftTracking";
import { isBadOrder } from "@/features/orders/history";

const BAD_SHIFT_HOURLY_THRESHOLD = 45;
const HIGH_KM_WARNING_THRESHOLD = 5.5;
const LONG_BREAK_HOURS_THRESHOLD = 1.25;

export default function InsightsPage() {
  const { deliveries, shifts, fuelSettings } = useAppData();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const insights = calculateWeeklyInsights(deliveries);
  const completed = deliveries.filter((delivery) => delivery.status === "completed");
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, delivery) => sum + delivery.quickCheckResult.score, 0) / completed.length
      : 0;
  const grossIncome = completed.reduce(
    (sum, delivery) =>
      sum + (delivery.completion?.actualAmount ?? 0) + (delivery.completion?.tipCash ?? 0),
    0
  );
  const totalFuelCost = completed.reduce(
    (sum, delivery) =>
      sum + calculateFuelCost(delivery.completion?.actualKm ?? delivery.estimatedKm, fuelSettings),
    0
  );
  const netAfterFuel = calculateProfit(grossIncome, totalFuelCost);
  const totalKm = completed.reduce((sum, delivery) => sum + (delivery.completion?.actualKm ?? delivery.estimatedKm), 0);
  const profitPerKm = calculatePerKm(netAfterFuel, totalKm);
  const totalWorkMinutes = shifts.reduce((sum, shift) => {
    const shiftEnd = shift.endedAt ?? new Date().toISOString();
    return sum + calculateWorkingMinutes(shift.startedAt, shiftEnd, shift.breaks ?? []);
  }, 0);
  const totalBreakHours = shifts.reduce((sum, shift) => sum + calculateBreakMinutes(shift.breaks ?? [], shift.endedAt ?? new Date().toISOString()) / 60, 0);
  const idleTimeEstimationMinutes = shifts.reduce((sum, shift) => sum + (shift.idleTimeEstimateMinutes ?? 0), 0);
  const profitPerHour = totalWorkMinutes > 0 ? netAfterFuel / (totalWorkMinutes / 60) : 0;
  const isBadShift = profitPerHour < BAD_SHIFT_HOURLY_THRESHOLD;
  const isHighKm = profitPerKm < HIGH_KM_WARNING_THRESHOLD;
  const isBreakTooLong = totalBreakHours > LONG_BREAK_HOURS_THRESHOLD;

  const mainProblem = isHighKm
    ? "ק״מ גבוה מדי"
    : completed.length < 8
      ? "מעט מדי משלוחים"
      : isBreakTooLong
        ? "יותר מדי זמן הפסקה"
        : "אין בעיה קריטית";

  const worstOrders = completed.filter(isBadOrder).slice(0, 5);

  const reportText = `Wolt Shift Report
Income: ₪${grossIncome.toFixed(2)}
KM: ${totalKm.toFixed(2)}
Profit: ₪${netAfterFuel.toFixed(2)}
Hourly Rate: ₪${profitPerHour.toFixed(2)}`;

  const shareToWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const downloadReportImage = async () => {
    if (!reportRef.current) return;
    try {
      setShareError(null);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0f172a"
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `shift-report-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch {
      setShareError("לא ניתן לייצא תמונה כרגע. נסה שוב.");
    }
  };

  return (
    <main className="space-y-4">
      <ScreenHeader title="תובנות חכמות" subtitle="איפה להרוויח יותר ואיפה נשרף זמן" />
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div ref={reportRef} className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4">
          <p className="text-xs text-emerald-300">Shift Report</p>
          <p className="mt-2 text-xl font-black text-white">₪{netAfterFuel.toFixed(0)} נטו</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
            <p>Income: ₪{grossIncome.toFixed(2)}</p>
            <p>KM: {totalKm.toFixed(2)}</p>
            <p>Profit: ₪{netAfterFuel.toFixed(2)}</p>
            <p>Hourly: ₪{profitPerHour.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="min-h-[2.8rem] rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-100"
          >
            Share to WhatsApp
          </button>
          <button
            type="button"
            onClick={downloadReportImage}
            className="min-h-[2.8rem] rounded-xl border border-sky-500/40 bg-sky-500/10 text-sm font-bold text-sky-100"
          >
            Download as image
          </button>
        </div>
        {shareError ? <p className="mt-2 text-xs text-rose-300">{shareError}</p> : null}
      </section>
      <section className="grid grid-cols-1 gap-3">
        <article
          className={`rounded-2xl border p-4 ${isBadShift ? "border-rose-500/40 bg-rose-500/10" : "border-emerald-500/40 bg-emerald-500/10"}`}
        >
          <p className="text-xs text-slate-300">סטטוס משמרת</p>
          <p className={`mt-2 text-2xl font-black ${isBadShift ? "text-rose-200" : "text-emerald-200"}`}>
            {isBadShift ? "Bad shift" : "Good shift"}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            רווח לשעה: ₪{profitPerHour.toFixed(1)} (סף מינימלי: ₪{BAD_SHIFT_HOURLY_THRESHOLD})
          </p>
        </article>

        <article className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-xs text-slate-300">Main problem</p>
          <p className="mt-2 text-2xl font-black text-amber-100">{mainProblem}</p>
          <p className="mt-1 text-xs text-slate-300">
            {isHighKm
              ? `רווח לק״מ נמוך: ₪${profitPerKm.toFixed(2)}`
              : completed.length < 8
                ? `כמות משלוחים נמוכה: ${completed.length}`
                : isBreakTooLong
                  ? `זמן הפסקות גבוה: ${totalBreakHours.toFixed(2)} שעות`
                  : "הביצועים מאוזנים, המשך באותם אזורים ושעות חזקות."}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="האזור הכי טוב היום" value={insights.bestDropoffZone} />
        <StatCard label="האזור הכי טוב השבוע" value={insights.bestZone} />
        <StatCard label="טווח שעה חזק" value={insights.bestHourRange} />
        <StatCard label="רווח / שעה" value={profitPerHour} />
        <StatCard label="רווח / ק״מ" value={profitPerKm} />
        <StatCard label="ממוצע ציון" value={avgScore} />
        <StatCard label="נטו אחרי דלק" value={netAfterFuel} asMoney />
        <StatCard label="הערכת זמן בטלה" value={`${idleTimeEstimationMinutes.toFixed(0)} דק׳`} />
      </section>

      {isHighKm || isBreakTooLong ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h3 className="text-base font-bold text-amber-100">אזהרות ביצועים</h3>
          <div className="mt-2 space-y-1 text-sm text-amber-50">
            {isHighKm ? <p>- ק״מ גבוה ביחס לרווח. נסה לסנן נסיעות ארוכות ורווח נמוך.</p> : null}
            {isBreakTooLong ? <p>- הפסקות ארוכות פוגעות ברווח לשעה. שקול לקצר הפסקות בשעות חזקות.</p> : null}
          </div>
        </section>
      ) : null}

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
