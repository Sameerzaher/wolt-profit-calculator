"use client";

import type { ChangeEvent } from "react";
import type { DailySummaryPrefs, SavedDelivery } from "@/lib/types";
import { isToday } from "@/lib/date";

type DailySummaryProps = {
  deliveries: SavedDelivery[];
  prefs: DailySummaryPrefs;
  onPrefsChange: (next: DailySummaryPrefs) => void;
};

function round2(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export default function DailySummary({ deliveries, prefs, onPrefsChange }: DailySummaryProps) {
  const il = "\u20aa";
  const today = deliveries.filter((item) => isToday(item.createdAt));

  const totalAppEarnings = today.reduce((sum, item) => sum + item.price, 0);
  const tipsFromHistory = today.reduce((sum, item) => sum + item.cashTip, 0);
  const extra = Math.max(0, prefs.extraCashTipsNis ?? 0);
  const totalCashTips =
    prefs.tipsInputMode === "from_history" ? tipsFromHistory + extra : prefs.cashTipsNis;
  const totalRealEarnings = totalAppEarnings + totalCashTips;

  const hoursWorked = Math.max(0, prefs.hoursWorked);
  const realHourlyRate = hoursWorked > 0 ? totalRealEarnings / hoursWorked : 0;

  const numberOfOrders = today.length;
  const avgNisPerKm =
    today.length > 0 ? today.reduce((s, i) => s + i.nisPerKm, 0) / today.length : 0;
  const avgScore = today.length > 0 ? today.reduce((s, i) => s + i.score, 0) / today.length : 0;

  const setTipsMode = (mode: DailySummaryPrefs["tipsInputMode"]) => {
    onPrefsChange({ ...prefs, tipsInputMode: mode });
  };

  const onHours = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    onPrefsChange({ ...prefs, hoursWorked: Number.isFinite(n) ? Math.max(0, n) : 0 });
  };

  const onManualTips = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    onPrefsChange({ ...prefs, cashTipsNis: Number.isFinite(n) ? Math.max(0, n) : 0 });
  };

  const onExtraTips = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    onPrefsChange({ ...prefs, extraCashTipsNis: Number.isFinite(n) ? Math.max(0, n) : 0 });
  };

  const secondaryCards = [
    { label: "הכנסה מהאפליקציה (היום)", value: `${il}${round2(totalAppEarnings)}` },
    { label: "טיפים במזומן (סה״כ)", value: `${il}${round2(totalCashTips)}` },
    { label: "הזמנות שנשמרו היום", value: numberOfOrders.toString() },
    {
      label: "ממוצע \u20aa לק״מ",
      value: numberOfOrders > 0 ? round2(avgNisPerKm) : "—"
    },
    {
      label: "ממוצע ציון",
      value: numberOfOrders > 0 ? round2(avgScore) : "—"
    },
    {
      label: "שעות עבודה",
      value: hoursWorked > 0 ? round2(hoursWorked) : "—"
    }
  ];

  return (
    <section className="card-panel space-y-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <h2 className="text-xl font-black text-text">סיכום יום</h2>

      {/* Hero: what you actually care about at end of shift */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 dark:bg-primary/10">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">נטו ביד (היום)</p>
        <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-text sm:text-5xl">
          {il}
          {round2(totalRealEarnings)}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text/70">נטו לשעה</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-text sm:text-3xl">
              {hoursWorked > 0 ? `${il}${round2(realHourlyRate)}` : "—"}
            </p>
            {hoursWorked <= 0 && (
              <p className="mt-1 text-sm font-semibold text-muted">הזינו שעות למטה כדי לראות.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text/70">בדיקות היום</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-text sm:text-3xl">{numberOfOrders}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-accent/30 p-4 dark:bg-white/[0.04]">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-text/80">טיפים במזומן</p>
        <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row sm:rounded-xl sm:border-2 sm:border-border sm:bg-accent/80 sm:p-1 dark:sm:bg-black/25">
          <button
            type="button"
            onClick={() => setTipsMode("from_history")}
            className={`min-h-[3.25rem] flex-1 rounded-xl px-3 py-3 text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-base ${
              prefs.tipsInputMode === "from_history"
                ? "bg-card text-primary shadow-sm ring-2 ring-primary/20 dark:bg-slate-700"
                : "text-muted"
            }`}
          >
            מהבדיקות השמורות
          </button>
          <button
            type="button"
            onClick={() => setTipsMode("manual")}
            className={`min-h-[3.25rem] flex-1 rounded-xl px-3 py-3 text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-base ${
              prefs.tipsInputMode === "manual"
                ? "bg-card text-primary shadow-sm ring-2 ring-primary/20 dark:bg-slate-700"
                : "text-muted"
            }`}
          >
            סכום ידני
          </button>
        </div>
        {prefs.tipsInputMode === "manual" && (
          <label className="block">
            <span className="label-base">סה״כ טיפים במזומן ({il})</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              className="input-base"
              value={prefs.cashTipsNis || ""}
              onChange={onManualTips}
            />
          </label>
        )}
        {prefs.tipsInputMode === "from_history" && (
          <div className="space-y-3">
            <p className="text-base font-semibold leading-snug text-text">
              מבדיקות היום:{" "}
              <span className="font-black tabular-nums text-primary">
                {il}
                {round2(tipsFromHistory)}
              </span>
            </p>
            <label className="block">
              <span className="label-base">טיפים נוספים במזומן ({il}, אופציונלי)</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                className="input-base"
                value={extra || ""}
                onChange={onExtraTips}
                placeholder="0"
              />
            </label>
          </div>
        )}
      </div>

      <label className="block">
        <span className="label-base">שעות עבודה היום</span>
        <input
          type="number"
          min={0}
          step={0.25}
          inputMode="decimal"
          className="input-base"
          value={prefs.hoursWorked || ""}
          onChange={onHours}
          placeholder="למשל 6.5"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {secondaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border-2 border-border bg-accent/25 p-4 dark:bg-white/[0.04]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-text/70">{card.label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-text sm:text-3xl">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
