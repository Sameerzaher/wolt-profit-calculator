import { formatDateTime, isToday } from "@/lib/date";
import type { SavedDelivery } from "@/lib/types";

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

function verdictBadgeClass(verdict: SavedDelivery["verdict"]): string {
  if (verdict === "שווה מאוד") return "bg-emerald-500/25 text-emerald-700 dark:text-emerald-200";
  if (verdict === "שווה") return "bg-lime-400/30 text-lime-900 dark:text-lime-100";
  if (verdict === "גבולי") return "bg-amber-400/30 text-amber-900 dark:text-amber-100";
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
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">היסטוריה</h2>
        <div className="flex flex-wrap items-center gap-2">
          {onDuplicateLast && deliveries.length > 0 && (
            <button
              type="button"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
              onClick={onDuplicateLast}
            >
              שכפל אחרון
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
          >
            נקה הכל
          </button>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-border p-1">
        <button
          type="button"
          onClick={() => onFilterChange("today")}
          className={`rounded-lg px-4 py-2 text-base font-medium ${filter === "today" ? "bg-primary/15 text-primary" : "text-muted"}`}
        >
          היום
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`rounded-lg px-4 py-2 text-base font-medium ${filter === "all" ? "bg-primary/15 text-primary" : "text-muted"}`}
        >
          הכל
        </button>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && <p className="text-base text-muted">אין משלוחים להצגה.</p>}

        {filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-bg/40 p-4 dark:bg-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-medium text-muted">{formatDateTime(item.createdAt)}</p>
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${verdictBadgeClass(item.verdict)}`}>
                {item.verdict}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-base">
              <p>
                <span className="text-muted">תשלום</span>{" "}
                <span className="font-bold tabular-nums">₪{item.payout.toFixed(0)}</span>
              </p>
              <p>
                <span className="text-muted">דקות</span> <span className="font-bold tabular-nums">{item.minutes}</span>
              </p>
              <p>
                <span className="text-muted">ק״מ</span> <span className="font-bold tabular-nums">{item.km.toFixed(1)}</span>
              </p>
              <p>
                <span className="text-muted">₪/דקה</span>{" "}
                <span className="font-extrabold tabular-nums text-primary">{item.ilsPerMinute.toFixed(2)}</span>
              </p>
              <p className="col-span-2">
                <span className="text-muted">₪ נטו לדקה</span>{" "}
                <span className="font-bold tabular-nums">{(item.netIlsPerMinute ?? item.ilsPerMinute).toFixed(2)}</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded-xl border border-border px-4 py-2.5 text-base font-medium text-text"
              >
                ערוך
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-xl border border-rose-500/50 px-4 py-2.5 text-base font-semibold text-rose-600 dark:text-rose-300"
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
