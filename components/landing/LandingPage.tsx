"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock,
  Fuel,
  Sparkles,
  Star,
  TrendingUp,
  Zap
} from "lucide-react";
import DashboardMockup from "@/components/landing/DashboardMockup";
import StickyMobileCta from "@/components/landing/StickyMobileCta";
import { FadeIn } from "@/components/ui/motion";
import { ROUTES } from "@/lib/routes";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
};

const PLATFORMS = ["Wolt", "Ten Bis", "HaAt"];

const PAINS = [
  { icon: Clock, title: "שעות ארוכות, בלי תמונה אמיתית", text: "קשה לדעת כמה באמת נשאר אחרי דלק, ביטוח ועלויות קבועות." },
  { icon: Fuel, title: "הוצאות בולעות את הרווח", text: "מחשבונים כלליים לא מבינים רכב, ק״מ ועלויות חודשיות של שליח." },
  { icon: BarChart3, title: "שלוש אפליקציות — אפס סיכום", text: "כל פלטפורמה בנפרד. אין השוואה, אין תובנות, אין החלטות חכמות." }
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: "רווח נטו אמיתי",
    text: "הכנסה פחות דלק, קבועות ורכב — ₪ לשעה ו-₪ לק״מ שאפשר לסמוך עליהם."
  },
  {
    icon: BarChart3,
    title: "ניתוחים מתקדמים",
    text: "שבועי, חודשי, מפת שעות רווחיות והשוואת פלטפורמות במבט אחד."
  },
  {
    icon: Camera,
    title: "ייבוא מצילום מסך",
    text: "OCR ממלא הכנסה, שעות ומשלוחים — אתם רק בודקים ושומרים."
  },
  {
    icon: Sparkles,
    title: "תובנות חכמות",
    text: "איזה יום, איזו שעה ואיזו פלטפורמה הכי משתלמים עבורכם."
  }
];

const STEPS = [
  { n: "1", title: "הגדירו רכב", text: "רכב, קטנוע או חשמלי — עם עלויות דלק וקבועות." },
  { n: "2", title: "הוסיפו משמרות", text: "מקטע לכל פלטפורמה: שעות, הכנסה, ק״מ ומשלוחים." },
  { n: "3", title: "קבלו החלטות", text: "לוח בקרה, גרפים ותובנות — מה לעבוד ומתי." }
];

const TESTIMONIALS = [
  {
    name: "יוסי, תל אביב",
    role: "שליח Wolt + Ten Bis",
    quote: "סוף סוף אני יודע אם שווה לי לצאת בערב או להתמקד בצהריים. הרווח עלה בלי לעבוד יותר שעות.",
    stars: 5
  },
  {
    name: "מיכל, חיפה",
    role: "שליחה, שלוש פלטפורמות",
    quote: "הייבוא מצילום מסך חוסך לי זמן אחרי משמרת. הכל בעברית ונוח בנייד.",
    stars: 5
  },
  {
    name: "אחמד, ירושלים",
    role: "קטנוע חשמלי",
    quote: "השוואה בין אפליקציות פתחה לי את העיניים — עברתי למה שמשלם באמת.",
    stars: 5
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-sm font-black text-slate-950">
              DC
            </span>
            <span className="text-lg font-extrabold text-white">DeliveryCalc</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-400 md:flex">
            <a href="#features" className="hover:text-white">
              יכולות
            </a>
            <a href="#analytics" className="hover:text-white">
              ניתוחים
            </a>
            <a href="#how" className="hover:text-white">
              איך זה עובד
            </a>
          </nav>
          <Link href={ROUTES.app} className="btn-primary hidden px-5 py-2.5 text-sm md:inline-flex">
            נסה עכשיו
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-4 pt-10 md:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(52,211,153,0.12),transparent_55%)]" />
        <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
              <Zap className="h-3.5 w-3.5" />
              פלטפורמת רווח לשליחים בישראל
            </p>
            <h1 className="mt-4 text-display font-black leading-tight text-white md:text-5xl">
              הרווח האמיתי שלך —
              <span className="bg-gradient-to-l from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                {" "}
                בכל פלטפורמה
              </span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              Wolt, Ten Bis ו-HaAt במקום אחד. חישוב נטו, ניתוחים, OCR ותובנות — מותאם לשליחים
              שעובדים מהנייד.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <span
                  key={p}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-bold text-slate-300"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.app} className="btn-primary flex-1 shadow-glow">
                נסה עכשיו
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link href={ROUTES.app} className="btn-secondary flex-1">
                התחל לעקוב אחרי הרווח שלך
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">ללא הרשמה · נתונים נשמרים במכשיר · PWA</p>
          </FadeIn>
          <DashboardMockup />
        </div>
      </section>

      {/* Pain */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-center text-2xl font-black text-white md:text-3xl">
          מכירים את זה?
        </motion.h2>
        <motion.p {...fadeUp} className="mx-auto mt-2 max-w-lg text-center text-slate-400">
          שליחות בישראל זה עבודה קשה. בלי כלים נכונים — אתם מנחשים במקום לדעת.
        </motion.p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PAINS.map((item, i) => (
            <motion.article
              key={item.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass-elevated p-5"
            >
              <item.icon className="h-8 w-8 text-amber-400" />
              <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-base text-slate-400">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-2xl font-black text-white md:text-3xl">
          הכל מה שצריך שליח מקצועי
        </motion.h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="glass p-5"
            >
              <f.icon className="h-7 w-7 text-emerald-400" />
              <h3 className="mt-3 font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-slate-400">{f.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Analytics preview */}
      <section id="analytics" className="mx-auto max-w-5xl px-4 py-16">
        <div className="glass-strong overflow-hidden p-6 md:p-10">
          <motion.div {...fadeUp}>
            <p className="text-label text-emerald-300">תצוגה מקדימה</p>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">לוח ניתוחים מתקדם</h2>
            <p className="mt-3 max-w-xl text-slate-400">
              מגמות שבועיות וחודשיות, מפת שעות רווחיות, השוואת פלטפורמות ותובנות בסגנון AI —
              למשל &quot;חמישי בערב הכי משתלם&quot; או &quot;Wolt נותן לך את ה-₪ לשעה הגבוה ביותר&quot;.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "רווח נטו כולל דלק והוצאות",
                "הפלטפורמה והשעה הכי משתלמים",
                "ימים ומשמרות מובילים"
              ].map((line) => (
                <li key={line} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href={ROUTES.dashboard} className="btn-secondary mt-8 inline-flex">
              ללוח הניתוחים
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-center text-2xl font-black text-white">
          איך זה עובד
        </motion.h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.li key={step.n} {...fadeUp} transition={{ delay: i * 0.1 }} className="glass-elevated p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-lg font-black text-emerald-300">
                {step.n}
              </span>
              <h3 className="mt-3 font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-slate-400">{step.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-center text-2xl font-black text-white">
          שליחים כבר משתמשים
        </motion.h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              {...fadeUp}
              transition={{ delay: i * 0.08 }}
              className="glass p-5"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <motion.div
          {...fadeUp}
          className="glass-strong relative overflow-hidden p-8 text-center md:p-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(52,211,153,0.2),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-2xl font-black text-white md:text-4xl">מוכנים לדעת כמה אתם באמת מרוויחים?</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              התחילו לעקוב היום — האפליקציה נשמרת במכשיר ועובדת גם כ-PWA ללא אינטרנט.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={ROUTES.app} className="btn-primary flex-1 shadow-glow sm:max-w-xs">
                נסה עכשיו
              </Link>
              <Link href={ROUTES.app} className="btn-secondary flex-1 sm:max-w-xs">
                התחל לעקוב אחרי הרווח שלך
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center text-sm text-slate-500 md:flex-row md:justify-between md:text-start">
          <p>© {new Date().getFullYear()} DeliveryCalc · נבנה לשליחים בישראל</p>
          <div className="flex gap-4">
            <Link href={ROUTES.app} className="hover:text-emerald-300">
              האפליקציה
            </Link>
            <Link href={ROUTES.dashboard} className="hover:text-emerald-300">
              ניתוחים
            </Link>
          </div>
        </div>
      </footer>

      <StickyMobileCta />
    </div>
  );
}
