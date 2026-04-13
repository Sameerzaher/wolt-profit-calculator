"use client";

import { decisionLabelHebrew, formatNisPerHour } from "@/lib/evaluateOrder";
import type { DecisionKind, OrderEvaluation } from "@/lib/types";

type ResultCardProps = {
  result: OrderEvaluation | null;
  inputIssues: string[];
};

function decisionVisual(d: DecisionKind): string {
  if (d === "strong_accept") {
    return "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-600";
  }
  if (d === "accept") {
    return "border-lime-500 bg-lime-400 text-slate-900 dark:border-lime-400 dark:bg-lime-500 dark:text-slate-950";
  }
  if (d === "depends") {
    return "border-amber-400 bg-amber-300 text-slate-900 dark:border-amber-300 dark:bg-amber-400 dark:text-slate-950";
  }
  return "border-rose-500 bg-rose-500 text-white dark:border-rose-400 dark:bg-rose-600";
}

export default function ResultCard({ result, inputIssues }: ResultCardProps) {
  if (inputIssues.length > 0) {
    return (
      <section className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4 shadow-soft">
        <h2 className="mb-2 text-lg font-bold">בדוק קלט</h2>
        <ul className="list-inside list-disc space-y-2 text-base font-medium text-text">
          {inputIssues.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">אחרי תיקון השדות תראה החלטה מיידית.</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 text-base text-muted shadow-soft">
        הזן מחיר ומרחק כדי לקבל ציון והמלצה.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h2 className="mb-3 text-lg font-bold">החלטה</h2>
      <div
        className={`mb-4 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-4 px-4 py-6 text-center shadow-inner ${decisionVisual(result.decision)}`}
      >
        <p className="text-sm font-bold uppercase tracking-wide opacity-90">ציון {result.score}</p>
        <p className="text-3xl font-black leading-tight sm:text-4xl">{decisionLabelHebrew(result.decision)}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">{"\u20aa/\u05e7\u05f4\u05de"}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight">{result.nisPerKm.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">{"\u20aa/\u05e9\u05e2\u05d4"}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNisPerHour(result.nisPerHour)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg/40 p-4 dark:bg-card/60">
        <p className="text-sm font-bold text-muted">נימוק</p>
        <p className="mt-2 text-lg font-semibold leading-snug">{result.reason}</p>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-base text-text">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
