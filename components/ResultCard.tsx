import type { CalculationResult } from "@/lib/types";

type ResultCardProps = {
  result: CalculationResult | null;
  inputIssues: string[];
};

function verdictVisual(verdict: CalculationResult["verdict"]): string {
  if (verdict === "שווה מאוד") {
    return "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-600";
  }
  if (verdict === "שווה") {
    return "border-lime-500 bg-lime-400 text-slate-900 dark:border-lime-400 dark:bg-lime-500 dark:text-slate-950";
  }
  if (verdict === "גבולי") {
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
        <p className="mt-3 text-sm text-muted">תיקון השדות יציג תוצאה מיידית.</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 text-base text-muted shadow-soft">
        אין תוצאה להצגה.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h2 className="mb-3 text-lg font-bold">תוצאה</h2>
      <div
        className={`mb-5 flex w-full items-center justify-center rounded-2xl border-4 px-4 py-6 text-center text-3xl font-black leading-tight shadow-inner sm:text-4xl ${verdictVisual(result.verdict)}`}
      >
        {result.verdict}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">₪ לדקה</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight">{result.ilsPerMinute.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">₪ לק״מ</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{result.ilsPerKm.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">₪ נטו לדקה</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">{result.netIlsPerMinute.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-muted">₪ נטו לק״מ</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{result.netIlsPerKm.toFixed(2)}</p>
        </div>
      </div>
      <p className="mt-4 text-base text-muted">{result.explanation}</p>
      <p className="mt-2 text-base font-semibold">{result.recommendation}</p>
    </section>
  );
}
