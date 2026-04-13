"use client";

import { decisionLabel } from "@/lib/evaluateOrder";
import { formatDateTime, isToday } from "@/lib/date";
import type { DecisionKind, SavedDelivery } from "@/lib/types";

type HistoryFilter = "today" | "all";

type HistoryListProps = {
  deliveries: SavedDelivery[];
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDuplicateLast?: () => void;
  onEdit: (delivery: SavedDelivery) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

function decisionBadgeClass(d: DecisionKind): string {
  if (d === "strong_accept") return "bg-emerald-500/25 text-emerald-700 dark:text-emerald-200";
  if (d === "accept") return "bg-lime-400/30 text-lime-900 dark:text-lime-100";
  if (d === "depends") return "bg-amber-400/30 text-amber-900 dark:text-amber-100";
  return "bg-rose-500/25 text-rose-700 dark:text-rose-200";
}

export default function HistoryList({
  deliveries,
  filter,
  onFilterChange,
  onDuplicateLast,
  onEdit,
  onDelete,
  onClearAll
}: HistoryListProps) {
  const filtered = filter === "today" ? deliveries.filter((item) => isToday(item.createdAt)) : deliveries;

  return (
    <section className="card-panel ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black text-text">בדיקות אחרונות</h2>
        <div className="flex flex-wrap items-center gap-2">
          {onDuplicateLast && deliveries.length > 0 && (
            <button
              type="button"
              className="min-h-[2.75rem] rounded-xl border-2 border-primary/40 bg-primary/10 px-4 py-2.5 text-base font-bold text-primary transition active:scale-[0.98]"
              onClick={onDuplicateLast}
            >
              שכפל אחרון
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-[2.75rem] rounded-xl border-2 border-border px-4 py-2.5 text-base font-semibold text-muted transition hover:border-muted hover:text-text"
          >
            מחק הכל
          </button>
        </div>
      </div>

      <div className="segmented mb-4 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onFilterChange("today")}
          className={`min-h-[2.75rem] flex-1 rounded-lg px-4 py-2.5 text-base font-semibold transition sm:flex-none ${filter === "today" ? "bg-card text-primary shadow-sm dark:bg-slate-700" : "text-muted"}`}
        >
          היום
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`min-h-[2.75rem] flex-1 rounded-lg px-4 py-2.5 text-base font-semibold transition sm:flex-none ${filter === "all" ? "bg-card text-primary shadow-sm dark:bg-slate-700" : "text-muted"}`}
        >
          הכל
        </button>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && <p className="text-base text-muted">אין עדיין בדיקות שמורות.</p>}

        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border bg-accent/25 p-4 dark:bg-white/[0.04]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-text/80">{formatDateTime(item.createdAt)}</p>
              <div
                className={`flex min-h-[2.75rem] items-center gap-2 rounded-xl border-2 border-border/60 px-3 py-2 ${decisionBadgeClass(item.decision)}`}
              >
                <span className="text-2xl font-black tabular-nums leading-none">{item.score}</span>
                <span className="max-w-[10rem] text-start text-sm font-bold leading-tight sm:max-w-none">
                  {decisionLabel(item.decision)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-base">
              <p>
                <span className="font-bold text-muted">מחיר</span>{" "}
                <span className="font-black tabular-nums text-text">
                  {"\u20aa"}
                  {item.price.toFixed(0)}
                </span>
              </p>
              <p>
                <span className="font-bold text-muted">ק״מ</span>{" "}
                <span className="font-black tabular-nums text-text">{item.distanceKm.toFixed(1)}</span>
              </p>
              <p>
                <span className="text-muted">דק׳</span>{" "}
                <span className="font-bold tabular-nums">{item.estimatedMinutes ?? "—"}</span>
              </p>
              <p>
                <span className="text-muted">טיפ</span>{" "}
                <span className="font-bold tabular-nums">
                  {"\u20aa"}
                  {item.cashTip.toFixed(0)}
                </span>
              </p>
              <p>
                <span className="text-muted">{"\u20aa/km"}</span>{" "}
                <span className="font-extrabold tabular-nums text-primary">{item.nisPerKm.toFixed(2)}</span>
              </p>
              <p className="col-span-2 text-sm text-muted">
                {item.isDoubleOrder && (
                  <span className="me-2 rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">כפול</span>
                )}
                {item.leavesHotZone && (
                  <span className="me-2 rounded-md bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-800 dark:text-amber-200">
                    מחוץ לאזור חם
                  </span>
                )}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="min-h-[2.75rem] rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold text-text shadow-sm transition active:scale-[0.98] dark:bg-card/80"
              >
                עריכה
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="min-h-[2.75rem] rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-2.5 text-base font-semibold text-rose-600 transition active:scale-[0.98] dark:text-rose-300"
              >
                מחק
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
