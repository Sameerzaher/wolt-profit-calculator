"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

type WeeklyPoint = { date: string; profit: number };
type MonthlyPoint = { month: string; profit: number };

type Props = {
  weekly: WeeklyPoint[];
  monthly: MonthlyPoint[];
};

export default function ShiftHistoryCharts({ weekly, monthly }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="space-y-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">טוען גרף שבועי...</article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">טוען גרף חודשי...</article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">גרף רווח שבועי</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="profit" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-white">גרף רווח חודשי</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
