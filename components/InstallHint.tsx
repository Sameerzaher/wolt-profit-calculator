"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "wolt_install_hint_dismissed_v1";

export default function InstallHint() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      const isStandalone =
        typeof window !== "undefined" &&
        ("standalone" in window.navigator) &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const mq = window.matchMedia("(display-mode: standalone)").matches;
      setHidden(dismissed || isStandalone || mq);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <section className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-base">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-text">
          התקנה למסך הבית (אייפון): לחץ <span className="whitespace-nowrap">שיתוף ↑</span> ואז &quot;הוסף למסך הבית&quot;.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-border px-2 py-1 text-sm text-muted"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
        >
          סגור
        </button>
      </div>
    </section>
  );
}
