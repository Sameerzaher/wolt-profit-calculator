"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/AppDataProvider";

const STEP_COUNT = 3;

export default function OnboardingTooltip() {
  const { appSettings, updateAppSettings } = useAppData();
  const [step, setStep] = useState(0);

  if (appSettings.onboardingDone) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => updateAppSettings({ ...appSettings, onboardingDone: true });

  return (
    <aside
      className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 shadow-lg shadow-sky-950/30"
      role="region"
      aria-label="מדריך התחלה ל-WoltCalc"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-sky-200">מדריך התחלה · שלב {step + 1} מתוך {STEP_COUNT}</p>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === step ? "bg-sky-400" : "bg-sky-800"}`}
            />
          ))}
        </div>
      </div>

      {step === 0 ? (
        <div className="space-y-2 text-sm leading-relaxed text-sky-50">
          <p className="font-bold text-white">ברוכים הבאים ל-WoltCalc</p>
          <p>אפליקציה לשליחי Wolt: החלטות לפני קבלת הצעה, מעקב במשמרת, וניתוח צילומי מסך אחרי המשמרת.</p>
          <ul className="list-inside list-disc space-y-1 text-xs text-sky-100/95">
            <li>כל הנתונים נשמרים במכשיר (אין שרת).</li>
            <li>מומלץ לגבות מדי פעם מהגדרות — &quot;ייצוא גיבוי מלא&quot;.</li>
          </ul>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3 text-sm text-sky-50">
          <p className="font-bold text-white">משמרת חיה</p>
          <p className="text-xs leading-relaxed text-sky-100/95">
            התחילו משמרת, הוסיפו משלוחים כשהם מסתיימים, וסיימו משמרת בסוף. במסך המשמרת אפשר להגדיר מקטעי עבודה והפסקות
            (כולל לילה שחוצה חצות).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/active-shift"
              className="flex min-h-[3rem] items-center justify-center rounded-xl bg-sky-500 text-center text-xs font-black text-slate-950"
            >
              מסך משמרת
            </Link>
            <Link
              href="/add-delivery"
              className="flex min-h-[3rem] items-center justify-center rounded-xl border border-sky-400/50 bg-slate-950/50 text-center text-xs font-bold text-sky-100"
            >
              הוסף משלוח
            </Link>
            <Link
              href="/quick-check"
              className="col-span-2 flex min-h-[2.85rem] items-center justify-center rounded-xl border border-sky-500/35 text-center text-xs font-bold text-sky-100"
            >
              בדיקת הצעה לפני קבלה
            </Link>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3 text-sm text-sky-50">
          <p className="font-bold text-white">אחרי המשמרת</p>
          <p className="text-xs leading-relaxed text-sky-100/95">
            העלו צילומי מסך מ-Wolt, תקנו את הטבלה אם צריך, ושמרו לפי תאריך. בהיסטוריה ובסיכום החודשי תראו ברוטו, עלות רכב,
            נטו ויעד שבועי.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/screenshot-analyzer"
              className="flex min-h-[3rem] items-center justify-center rounded-xl bg-emerald-500/90 text-center text-xs font-black text-slate-950"
            >
              ניתוח צילומים
            </Link>
            <Link
              href="/history"
              className="flex min-h-[3rem] items-center justify-center rounded-xl border border-sky-400/50 bg-slate-950/50 text-center text-xs font-bold text-sky-100"
            >
              היסטוריה
            </Link>
            <Link
              href="/monthly"
              className="col-span-2 flex min-h-[2.85rem] items-center justify-center rounded-xl border border-sky-500/35 text-center text-xs font-bold text-sky-100"
            >
              סיכום חודשי ושבועי
            </Link>
            <Link
              href="/settings"
              className="col-span-2 flex min-h-[2.85rem] items-center justify-center rounded-xl border border-slate-600 text-center text-xs font-semibold text-slate-200"
            >
              הגדרות · גיבוי ושחזור
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {step > 0 ? (
          <button
            type="button"
            className="rounded-xl border border-sky-400/50 px-4 py-2.5 text-sm font-semibold text-sky-100"
            onClick={goPrev}
            aria-label="שלב קודם במדריך"
          >
            הקודם
          </button>
        ) : null}
        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-black text-slate-950"
            onClick={goNext}
            aria-label="שלב הבא במדריך"
          >
            הבא
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-black text-slate-950"
            onClick={finish}
            aria-label="סגור מדריך התחלה"
          >
            סיום והבנתי
          </button>
        )}
        <button
          type="button"
          className="mr-auto rounded-xl border border-slate-500/60 px-3 py-2 text-xs font-semibold text-slate-300"
          onClick={finish}
          aria-label="דלג על מדריך ההתחלה"
        >
          דילוג
        </button>
      </div>
    </aside>
  );
}
