"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "בית" },
  { href: "/daily-shift", label: "יומי" },
  { href: "/platform-analytics", label: "ניתוח" },
  { href: "/quick-check", label: "בדיקה" },
  { href: "/active-shift", label: "משמרת" },
  { href: "/screenshot-analyzer", label: "צילומים" },
  { href: "/where-to-go", label: "לאן" },
  { href: "/insights", label: "תובנות" },
  { href: "/history", label: "היסטוריה" },
  { href: "/monthly", label: "חודשי" }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur"
      style={{ height: "var(--nav-height)" }}
    >
      <ul className="mx-auto grid h-full max-w-lg grid-cols-5 grid-rows-2 content-center gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[2.65rem] items-center justify-center rounded-xl px-1 py-1.5 text-center text-[11px] font-bold leading-tight ${
                  active ? "bg-emerald-500/20 text-emerald-200" : "text-slate-400"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
