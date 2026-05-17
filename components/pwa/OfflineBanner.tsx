"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[90] animate-slide-down border-b border-amber-500/40 bg-amber-950/95 px-4 py-2 pt-[max(env(safe-area-inset-top),8px)] text-center text-xs font-bold text-amber-100 backdrop-blur"
      role="status"
    >
      מצב לא מקוון — הנתונים נשמרים במכשיר
    </div>
  );
}
