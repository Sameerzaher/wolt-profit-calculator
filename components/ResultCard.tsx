"use client";

import { decisionLabel, formatNisPerHour } from "@/lib/evaluateOrder";
import type { DecisionKind, OrderEvaluation } from "@/lib/types";

type ResultCardProps = {
  result: OrderEvaluation | null;
  inputIssues: string[];
};

function decisionVisual(d: DecisionKind): string {
  if (d === "strong_accept") {
    return "border-emerald-700 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-600";
  }
  if (d === "accept") {
    return "border-lime-700 bg-lime-400 text-slate-950 dark:border-lime-400 dark:bg-lime-500 dark:text-slate-950";
  }
  if (d === "depends") {
    return "border-amber-600 bg-amber-400 text-slate-950 dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950";
  }
  return "border-rose-700 bg-rose-600 text-white dark:border-rose-400 dark:bg-rose-600";
}

/** Subtle stroke helps colored badges read in bright sun */
function decisionTextShadow(d: DecisionKind): string {
  if (d === "accept" || d === "depends") {
    return "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]";
  }
  return "[text-shadow:0_1px_2px_rgba(0,0,0,0.35)]";
}

export default function ResultCard({ result, inputIssues }: ResultCardProps) {
  if (inputIssues.length > 0) {
    return (
      <section className="card-panel border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <h2 className="mb-3 text-xl font-black text-text">תקינו את הקלט</h2>
        <ul className="space-y-2 text-lg font-semibold leading-snug text-text">
          {inputIssues.map((msg) => (
            <li key={msg} className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-400" aria-hidden>
                •
              </span>
              {msg}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-base font-medium text-text/90">תקנו את השדות למעלה — ההחלטה מתעדכנת בזמן אמת.</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="card-panel border-2 border-dashed border-border bg-accent/40 text-center dark:bg-white/[0.04]">
        <p className="mx-auto max-w-[18rem] text-lg font-medium leading-relaxed text-text">
          הזינו <span className="font-black text-primary">מחיר</span> ו־
          <span className="font-black text-primary">ק״מ</span> לקבלת המלצה מיידית.
        </p>
      </section>
    );
  }

  const ts = decisionTextShadow(result.decision);

  return (
    <section className="card-panel ring-2 ring-primary/15 dark:ring-primary/25" aria-live="polite">
      {/* Verdict first: score + label dominate for glance */}
      <div
        className={`mb-4 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-4 px-3 py-8 text-center sm:py-10 ${decisionVisual(result.decision)}`}
      >
        <p className={`text-sm font-black uppercase tracking-[0.2em] opacity-95 ${ts}`}>ציון</p>
        <p className={`text-6xl font-black tabular-nums leading-none sm:text-7xl ${ts}`}>{result.score}</p>
        <p className={`max-w-[95%] text-balance text-2xl font-black leading-tight sm:text-3xl ${ts}`}>
          {decisionLabel(result.decision)}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-border bg-accent/50 p-4 dark:bg-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-wide text-text/70">{"\u20aa"} לק״מ</p>
          <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-text sm:text-4xl">
            {result.nisPerKm.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border-2 border-border bg-accent/50 p-4 dark:bg-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-wide text-text/70">{"\u20aa"} לשעה</p>
          <p className="mt-2 text-2xl font-black tabular-nums text-text sm:text-3xl">{formatNisPerHour(result.nisPerHour)}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-border bg-accent/40 p-4 dark:bg-white/[0.05]">
        <p className="text-xs font-black uppercase tracking-wide text-text/70">במבט חטוף</p>
        <p className="mt-2 text-lg font-bold leading-snug text-text sm:text-xl">{result.reason}</p>
        <ul className="mt-4 space-y-3 text-base font-semibold leading-snug text-text sm:text-lg">
          {result.reasons.map((r, i) => (
            <li key={`${i}-${r}`} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
