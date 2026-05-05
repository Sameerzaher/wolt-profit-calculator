"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-5 pb-32">
      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-slate-900 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">WoltCalc</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-white">Know your real profit as a Wolt driver</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          מעקב פשוט אחרי משמרות, דלק, ק״מ וזמן עבודה כדי להבין כמה באמת נשאר לך נטו בכל שעה.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-black text-white">הבעיה</h2>
        <p className="mt-2 text-sm text-slate-300">רוב השליחים רואים רק סכום ברוטו ולא יודעים מה הרווח האמיתי אחרי דלק, ק״מ והפסקות.</p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-black text-white">הפתרון</h2>
        <p className="mt-2 text-sm text-slate-300">
          WoltCalc מחשב אוטומטית את הרווח האמיתי לפי נתוני משמרת וצילומי מסך, כולל ניתוח מהיר של הכנסות וזמן עבודה.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-black text-white">Demo</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-slate-400">הכנסה</p>
            <p className="mt-1 text-xl font-black text-emerald-300">₪742</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-slate-400">ק״מ</p>
            <p className="mt-1 text-xl font-black text-sky-300">61.4</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-slate-400">רווח</p>
            <p className="mt-1 text-xl font-black text-white">₪503</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-slate-400">לשעה</p>
            <p className="mt-1 text-xl font-black text-amber-200">₪78</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <h2 className="text-xl font-black text-white">Start tracking your shift</h2>
        <p className="mt-1 text-sm text-emerald-100">התחל עכשיו לעקוב אחרי כל משמרת ולדעת בדיוק כמה אתה מרוויח נטו.</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link
            href="/active-shift"
            className="flex min-h-[3.2rem] items-center justify-center rounded-2xl bg-emerald-500 text-base font-black text-slate-950"
          >
            Start tracking your shift
          </Link>
          <Link
            href="/screenshot-analyzer"
            className="flex min-h-[3rem] items-center justify-center rounded-2xl border border-emerald-400/40 bg-slate-900 text-sm font-bold text-emerald-100"
          >
            העלאת צילומי מסך לניתוח
          </Link>
        </div>
      </section>
    </main>
  );
}
