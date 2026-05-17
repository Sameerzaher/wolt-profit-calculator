"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Camera, ChevronLeft, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ROUTES } from "@/lib/routes";

const SLIDES = [
  {
    icon: Wallet,
    title: "הרווח האמיתי שלך",
    body: "Wolt · Ten Bis · HaAt במקום אחד. רואים כמה באמת נשאר בכיס אחרי דלק והוצאות."
  },
  {
    icon: Camera,
    title: "ייבוא מצילום מסך",
    body: "צילמתם סיכום יום? העלו תמונה — OCR ממלא הכנסה, שעות ומשלוחים. אתם רק מאשרים."
  },
  {
    icon: BarChart3,
    title: "ניתוחים ותובנות",
    body: "גרפים, השוואת פלטפורמות והמלצות חכמות — איזה יום ואיזו שעה הכי משתלמים."
  },
  {
    icon: Sparkles,
    title: "מוכנים לצאת לדרך?",
    body: "הוסיפו משמרת ראשונה או הגדירו רכב — הכל נשמר במכשיר, גם בלי אינטרנט."
  }
];

export default function OnboardingFlow() {
  const { show, complete } = useOnboarding();
  const [step, setStep] = useState(0);

  if (!show) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col bg-[#02040a]/98 backdrop-blur-xl"
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm font-bold text-emerald-400">DeliveryCalc</p>
          <button type="button" onClick={complete} className="text-sm font-semibold text-slate-500">
            דלג
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="flex flex-1 flex-col"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/30 bg-emerald-500/15 shadow-glow">
              <Icon className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h1 className="mt-8 text-display-sm text-white">{slide.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">{slide.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto flex gap-2 pt-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i === step ? "bg-emerald-400" : "bg-white/10"}`}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary min-w-[3.5rem] px-4"
              aria-label="הקודם"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          {isLast ? (
            <Link href={ROUTES.appAddShift} onClick={complete} className="btn-primary flex-1">
              הוסף משמרת ראשונה
            </Link>
          ) : (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-primary flex-1">
              המשך
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
