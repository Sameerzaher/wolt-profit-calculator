type Props = {
  series: Array<{ day: string; profit: number }>;
};

export default function WeeklyProfitBars({ series }: Props) {
  if (series.length === 0) {
    return <p className="text-sm text-slate-500">אין מספיק נתונים להצגת גרף.</p>;
  }
  const max = Math.max(...series.map((item) => item.profit), 1);
  return (
    <div className="space-y-2">
      {series.map((item) => (
        <div key={item.day} className="grid grid-cols-[50px_1fr_55px] items-center gap-2 text-xs">
          <span className="text-slate-400">{item.day}</span>
          <div className="h-3 rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: `${Math.max(6, (item.profit / max) * 100)}%` }}
            />
          </div>
          <span className="text-slate-300">{item.profit.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}
