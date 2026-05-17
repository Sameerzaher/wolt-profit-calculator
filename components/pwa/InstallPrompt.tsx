"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "deliverycalc_pwa_install_dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone);
    setIsIos(ios);

    if (ios && !standalone && localStorage.getItem(DISMISS_KEY) !== "1") {
      setShowIosHint(true);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (dismissed && !showIosHint) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <div
      className="fixed bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.5rem)] left-0 right-0 z-[35] mx-auto max-w-lg animate-slide-up px-4"
      role="dialog"
      aria-label="התקנת אפליקציה"
    >
      <div className="rounded-2xl border border-emerald-500/35 bg-slate-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
        <p className="text-sm font-black text-white">התקן את DeliveryCalc</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {showIosHint && isIos
            ? "באייפון: שתף → הוסף למסך הבית כדי לקבל אפליקציה מלאה."
            : "גישה מהירה, מסך מלא ועבודה גם ללא אינטרנט."}
        </p>
        <div className="mt-3 flex gap-2">
          {deferred ? (
            <button
              type="button"
              onClick={install}
              className="min-h-[2.75rem] flex-1 rounded-xl bg-emerald-500 text-sm font-black text-slate-950"
            >
              התקן עכשיו
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[2.75rem] rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300"
          >
            אולי אחר כך
          </button>
        </div>
      </div>
    </div>
  );
}
