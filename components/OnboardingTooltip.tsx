"use client";

import Link from "next/link";
import { useAppData } from "@/components/AppDataProvider";

export default function OnboardingTooltip() {
  const { appSettings, updateAppSettings } = useAppData();
  if (appSettings.onboardingDone) return null;

  return (
    <aside className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4">
      <p className="text-sm text-sky-100">
        ברוך הבא ל-WoltCalc V2. התחל מ-&quot;בדיקה מהירה&quot;, קבל ציון החלטה, ואז עקוב אחרי הביצוע בזמן אמת.
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/quick-check" className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950">
          להתחיל עכשיו
        </Link>
        <button
          type="button"
          className="rounded-lg border border-sky-400/60 px-3 py-2 text-sm font-semibold text-sky-100"
          onClick={() => updateAppSettings({ ...appSettings, onboardingDone: true })}
        >
          סגור
        </button>
      </div>
    </aside>
  );
}
