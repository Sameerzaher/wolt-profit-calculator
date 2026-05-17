"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function StickyMobileCta() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#02040a]/90 p-3 backdrop-blur-xl md:hidden">
      <Link href={ROUTES.app} className="btn-primary w-full shadow-glow">
        נסה עכשיו — חינם
      </Link>
    </div>
  );
}

