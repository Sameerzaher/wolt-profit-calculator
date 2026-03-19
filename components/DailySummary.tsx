import type { SavedDelivery } from "@/lib/types";
import { isToday } from "@/lib/date";

type DailySummaryProps = {
  deliveries: SavedDelivery[];
};

function round2(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export default function DailySummary({ deliveries }: DailySummaryProps) {
  const today = deliveries.filter((item) => isToday(item.createdAt));
  const totalPayout = today.reduce((sum, item) => sum + item.payout, 0);
  const totalNet = today.reduce((sum, item) => sum + (item.netPayout ?? item.payout), 0);
  const avgIlsPerMin =
    today.length > 0
      ? today.reduce((sum, item) => sum + item.ilsPerMinute, 0) / today.length
      : 0;
  const avgNetIlsPerMin =
    today.length > 0
      ? today.reduce((sum, item) => sum + (item.netIlsPerMinute ?? item.ilsPerMinute), 0) / today.length
      : 0;
  const goodCount = today.filter((item) => item.verdict === "שווה" || item.verdict === "שווה מאוד").length;
  const goodRate = today.length > 0 ? (goodCount / today.length) * 100 : 0;

  const cards = [
    {
      label: "משלוחים שנשמרו היום",
      value: today.length.toString()
    },
    {
      label: "סה\"כ הכנסה היום",
      value: `₪${round2(totalPayout)}`
    },
    {
      label: "ממוצע ₪ לדקה",
      value: round2(avgIlsPerMin)
    },
    {
      label: "סה\"כ נטו היום",
      value: `₪${round2(totalNet)}`
    },
    {
      label: "ממוצע ₪ נטו לדקה",
      value: round2(avgNetIlsPerMin)
    },
    {
      label: "אחוז משלוחים טובים",
      value: `${round2(goodRate)}%`
    }
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <p className="text-sm font-medium text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
