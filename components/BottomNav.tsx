"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "בית" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur">
      <ul className="mx-auto flex max-w-lg gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={`block min-h-[3rem] min-w-[4.25rem] rounded-xl px-2 py-2 text-center text-xs font-bold ${
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
