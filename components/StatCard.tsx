import { formatIls } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  asMoney?: boolean;
};

export default function StatCard({ label, value, hint, asMoney = false }: Props) {
  const displayValue = typeof value === "number" ? (asMoney ? formatIls(value) : value.toFixed(1)) : value;
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 shadow-xl shadow-black/20">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{displayValue}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
