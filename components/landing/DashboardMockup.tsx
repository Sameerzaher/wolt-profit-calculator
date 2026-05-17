"use client";

import { motion } from "framer-motion";
import { Bike, TrendingUp, Wallet } from "lucide-react";

const float = (delay: number) => ({
  y: [0, -10, 0],
  transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay }
});

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-10 h-[22rem] max-w-sm" aria-hidden>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-strong absolute inset-x-4 top-6 z-10 p-5 shadow-glow"
      >
        <p className="text-xs font-bold text-emerald-400">לוח בקרה · היום</p>
        <p className="mt-2 text-3xl font-black text-white" dir="ltr">
          ₪428
          <span className="text-base font-semibold text-slate-500"> נטו</span>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="glass rounded-xl p-3">
            <p className="text-[10px] text-slate-500">₪ לשעה</p>
            <p className="text-lg font-bold text-sky-300" dir="ltr">
              62.4
            </p>
          </div>
          <motion.div animate={float(0.3)} className="glass rounded-xl p-3">
            <p className="text-[10px] text-slate-500">ק״מ</p>
            <p className="text-lg font-bold text-white" dir="ltr">
              38.2
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        animate={float(0)}
        className="glass-elevated absolute right-0 top-0 z-20 flex items-center gap-2 rounded-2xl border border-emerald-400/30 px-3 py-2 shadow-glass-lg"
      >
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold text-emerald-200">Wolt הכי משתלם</span>
      </motion.div>

      <motion.div
        animate={float(0.6)}
        className="glass-elevated absolute left-0 bottom-16 z-20 rounded-2xl border border-violet-400/25 px-3 py-2.5 shadow-glass-lg"
      >
        <p className="text-[10px] text-violet-300">תובנה חכמה</p>
        <p className="text-xs font-bold text-white">חמישי ערב = שיא רווח</p>
      </motion.div>

      <motion.div
        animate={float(1.1)}
        className="glass absolute bottom-4 right-6 z-0 flex items-center gap-2 rounded-xl px-3 py-2"
      >
        <Wallet className="h-4 w-4 text-slate-400" />
        <span className="text-xs text-slate-400">Ten Bis · HaAt</span>
      </motion.div>

      <motion.div
        animate={{ rotate: [0, 4, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute -left-2 bottom-2 rounded-2xl bg-emerald-500/20 p-3"
      >
        <Bike className="h-8 w-8 text-emerald-300" />
      </motion.div>
    </div>
  );
}
