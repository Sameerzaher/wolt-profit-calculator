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
        "standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const mq = window.matchMedia("(display-mode: standalone)").matches;
      setHidden(dismissed || isStandalone || mq);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <section className="rounded-xl border border-primary/35 bg-primary/10 p-4 text-base dark:bg-primary/15">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug text-text sm:text-base">
          ב־iPhone: הקישו על <span className="whitespace-nowrap">שיתוף ↑</span>, ואז &quot;הוסף למסך הבית&quot; לגישה מהירה.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted shadow-sm sm:text-sm"
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
