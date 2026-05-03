"use client";

type Props = {
  grossIncome: number;
  vehicleCost: number;
  netIncome: number;
  grossPerHour: number;
  netPerHour: number;
  grossPerKm: number | undefined;
  netPerKm?: number;
};

export default function NetProfitCard({
  grossIncome,
  vehicleCost,
  netIncome,
  grossPerHour,
  netPerHour,
  grossPerKm,
  netPerKm
}: Props) {
  const netToneClass = netPerHour > 60 ? "text-emerald-300" : netPerHour >= 40 ? "text-amber-300" : "text-rose-300";
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm font-bold text-slate-200">רווח לפי ק״מ ועלות לק״מ</p>
      <p className="mt-1 text-xs text-slate-400">מחושב לפי ק״מ אמיתי ועלות לק״מ שהזנת, ולפי שעות המקטעים (אם הוגדרו)</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <StatLine label="הכנסה ברוטו" value={`₪${grossIncome.toFixed(1)}`} />
        <StatLine label="עלות רכב (ק״מ)" value={`₪${vehicleCost.toFixed(1)}`} />
        <StatLine label="רווח נטו" value={`₪${netIncome.toFixed(1)}`} />
        <StatLine label="ברוטו לשעה" value={`₪${grossPerHour.toFixed(1)}`} />
        <StatLine label="נטו לשעה" value={`₪${netPerHour.toFixed(1)}`} valueClassName={netToneClass} />
        <StatLine label="ברוטו לק״מ" value={grossPerKm !== undefined ? `₪${grossPerKm.toFixed(2)}` : "—"} />
        <StatLine label="נטו לק״מ" value={netPerKm !== undefined ? `₪${netPerKm.toFixed(2)}` : "—"} />
      </div>
    </section>
  );
}

function StatLine({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black text-white ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
