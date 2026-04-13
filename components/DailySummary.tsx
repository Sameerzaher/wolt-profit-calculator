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
  const totalCashTips =
    prefs.tipsInputMode === "from_history" ? tipsFromHistory : prefs.cashTipsNis;
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

  const cards = [
    {
      label: "\u05e1\u05da \u05de\u05d4\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4 (\u05d4\u05d9\u05d5\u05dd)",
      value: `${il}${round2(totalAppEarnings)}`
    },
    {
      label: "\u05e1\u05d4\"\u05db \u05d8\u05d9\u05e4\u05d9\u05dd \u05de\u05d6\u05d5\u05de\u05df",
      value: `${il}${round2(totalCashTips)}`
    },
    {
      label: "\u05e1\u05d4\"\u05db \u05d0\u05de\u05d9\u05ea\u05d9",
      value: `${il}${round2(totalRealEarnings)}`
    },
    {
      label: "\u05de\u05e1\u05e4\u05e8 \u05d4\u05d6\u05de\u05e0\u05d5\u05ea (\u05e0\u05e9\u05de\u05e8\u05d5 \u05d4\u05d9\u05d5\u05dd)",
      value: numberOfOrders.toString()
    },
    {
      label: "\u05de\u05de\u05d5\u05e6\u05e2 \u20aa/\u05e7\u05f4\u05de",
      value: numberOfOrders > 0 ? round2(avgNisPerKm) : "\u2014"
    },
    {
      label: "\u05de\u05de\u05d5\u05e6\u05e2 \u05e6\u05d9\u05d5\u05df",
      value: numberOfOrders > 0 ? round2(avgScore) : "\u2014"
    },
    {
      label: "\u05e9\u05e2\u05d5\u05ea \u05e2\u05d1\u05d5\u05d3\u05d4",
      value: hoursWorked > 0 ? round2(hoursWorked) : "\u2014"
    },
    {
      label: "\u20aa \u05dc\u05e9\u05e2\u05d4 \u05d0\u05de\u05d9\u05ea\u05d9\u05ea",
      value: hoursWorked > 0 ? `${round2(realHourlyRate)} ${il}/\u05e9\u05e2\u05d4` : "\u2014"
    }
  ];

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h2 className="text-lg font-bold">סיכום יום</h2>

      <div className="rounded-xl border border-border bg-bg/30 p-4 dark:bg-card/50">
        <p className="mb-3 text-sm font-semibold text-muted">טיפים מזומן</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipsMode("from_history")}
            className={`rounded-xl border-2 px-4 py-3 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              prefs.tipsInputMode === "from_history" ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            סכם מההיסטוריה
          </button>
          <button
            type="button"
            onClick={() => setTipsMode("manual")}
            className={`rounded-xl border-2 px-4 py-3 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              prefs.tipsInputMode === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            הזנה ידנית
          </button>
        </div>
        {prefs.tipsInputMode === "manual" && (
          <label className="block">
            <span className="label-base">{`\u05e1\u05db\u05d5\u05dd \u05d8\u05d9\u05e4\u05d9\u05dd (\u20aa)`}</span>
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
          <p className="text-sm text-muted">
            {"\u05de\u05e1\u05db\u05dd \u05d8\u05d9\u05e4\u05d9\u05dd \u05de\u05e9\u05d5\u05e8\u05d5\u05ea \u05e9\u05e0\u05e9\u05de\u05e8\u05d5 \u05d4\u05d9\u05d5\u05dd: "}
            {il}
            {round2(tipsFromHistory)}).
          </p>
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
          placeholder="לדוגמה 6.5"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-border bg-bg/40 p-4 dark:bg-card/60">
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
