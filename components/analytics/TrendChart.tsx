"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/analytics";

export type TrendMetric = "income" | "netProfit" | "kilometers" | "netProfitPerHour";

const CONFIG: Record<
  TrendMetric,
  { dataKey: keyof TrendPoint; label: string; color: string; format: (v: number) => string }
> = {
  income: { dataKey: "income", label: "הכנסה", color: "#34d399", format: (v) => `₪${v.toFixed(0)}` },
  netProfit: { dataKey: "netProfit", label: "רווח נטו", color: "#22c55e", format: (v) => `₪${v.toFixed(0)}` },
  kilometers: { dataKey: "kilometers", label: "ק״מ", color: "#38bdf8", format: (v) => v.toFixed(1) },
  netProfitPerHour: {
    dataKey: "netProfitPerHour",
    label: "₪ לשעה (נטו)",
    color: "#fbbf24",
    format: (v) => `₪${v.toFixed(1)}`
  }
};

export default function TrendChart({
  title,
  data,
  metric
}: {
  title: string;
  data: TrendPoint[];
  metric: TrendMetric;
}) {
  const [mounted, setMounted] = useState(false);
  const cfg = CONFIG[metric];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) {
    return (
      <article className="app-card">
        <p className="text-label">{title}</p>
        <p className="mt-3 text-base text-slate-500">אין מספיק נתונים לגרף</p>
      </article>
    );
  }

  return (
    <article className="app-card">
      <p className="text-label">{title}</p>
      <div className="mt-3 h-52" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} width={36} />
            <Tooltip
              formatter={(value) => [cfg.format(Number(value ?? 0)), cfg.label]}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey={cfg.dataKey}
              stroke={cfg.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: cfg.color }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
