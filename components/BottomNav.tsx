"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "בית" },
  { href: "/quick-check", label: "בדיקה" },
  { href: "/active-delivery", label: "פעיל" },
  { href: "/shift-stats", label: "משמרת" },
  { href: "/zone-performance", label: "אזורים" },
  { href: "/settings", label: "הגדרות" }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-6 gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block min-h-[3rem] rounded-xl px-1 py-2 text-center text-xs font-bold ${
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
