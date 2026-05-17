"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, PlusCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/routes";

const navItems = [
  { href: ROUTES.app, label: "בית", icon: Home, match: (p: string) => p === ROUTES.app },
  {
    href: ROUTES.appAddShift,
    label: "משמרת",
    icon: PlusCircle,
    match: (p: string) => p.startsWith(ROUTES.appAddShift)
  },
  {
    href: ROUTES.dashboard,
    label: "ניתוחים",
    icon: BarChart3,
    match: (p: string) => p.startsWith(ROUTES.dashboard)
  },
  {
    href: ROUTES.appCourierInsights,
    label: "תובנות",
    icon: Sparkles,
    match: (p: string) => p.startsWith(ROUTES.appCourierInsights)
  }
];

const HIDE_NAV_PREFIXES = [
  "/screenshot-analyzer",
  "/history",
  "/active-shift",
  "/ocr",
  ROUTES.appImportScreenshot
];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  if (!pathname.startsWith(ROUTES.app) && !pathname.startsWith(ROUTES.dashboard)) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2"
      style={{ height: "var(--nav-height)" }}
      aria-label="ניווט ראשי"
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.06] shadow-dock backdrop-blur-xl">
        <ul className="grid grid-cols-4 gap-0.5 p-1.5">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href} className="relative">
                {active ? (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl border border-emerald-400/25 bg-emerald-500/20"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Link
                  href={item.href}
                  className={`relative flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors active:scale-95 ${
                    active ? "text-emerald-200" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="text-[10px] font-bold leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
