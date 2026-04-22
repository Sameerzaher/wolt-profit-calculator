import { formatIls } from "@/lib/utils";

type Props = {
  grossIncome: number;
  netProfit: number;
  ilsPerHour: number;
  totalDeliveries: number;
};

export default function ShiftSummaryCard({ grossIncome, netProfit, ilsPerHour, totalDeliveries }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-lg font-bold text-white">סיכום משמרת</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <p className="rounded-xl bg-slate-800 p-3 text-slate-200">ברוטו: {formatIls(grossIncome)}</p>
        <p className="rounded-xl bg-slate-800 p-3 text-slate-200">נטו: {formatIls(netProfit)}</p>
        <p className="rounded-xl bg-slate-800 p-3 text-slate-200">₪/שעה: {ilsPerHour.toFixed(1)}</p>
        <p className="rounded-xl bg-slate-800 p-3 text-slate-200">משלוחים: {totalDeliveries}</p>
      </div>
    </section>
  );
}
