"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const minMs = 550;
    const start = Date.now();
    const hide = () => {
      const wait = Math.max(0, minMs - (Date.now() - start));
      window.setTimeout(() => setVisible(false), wait);
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02040a]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(52,211,153,0.15),transparent_55%)]" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-glow"
      >
        <span className="text-4xl font-black text-slate-950">DC</span>
      </motion.div>
      <p className="relative mt-6 text-2xl font-extrabold text-white">DeliveryCalc</p>
      <p className="relative mt-1 text-base text-slate-400">מחשבון רווח לשליחים</p>
    </motion.div>
  );
}
