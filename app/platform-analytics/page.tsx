"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DateRangeFilterBar from "@/components/analytics/DateRangeFilterBar";
import PlatformAnalyticsCard from "@/components/analytics/PlatformAnalyticsCard";
import PlatformRecommendationCard from "@/components/analytics/PlatformRecommendationCard";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppData } from "@/components/AppDataProvider";
import { buildPlatformAnalyticsDashboard, resolveDateRange } from "@/lib/platformAnalytics";
import { getTodayDateInput } from "@/src/lib/dateTime";
import type { DateRangePreset } from "@/types/models";

export default function PlatformAnalyticsPage() {
  const { dayShifts, isHydrated } = useAppData();
  const today = getTodayDateInput();

  const [preset, setPreset] = useState<DateRangePreset>("week");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  const range = useMemo(
    () => resolveDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const dashboard = useMemo(
    () => buildPlatformAnalyticsDashboard(dayShifts, range),
    [dayShifts, range]
  );

  const onPresetChange = (next: DateRangePreset) => {
    setPreset(next);
    if (next !== "custom") return;
    const resolved = resolveDateRange("week");
    setCustomStart(resolved.startDate);
    setCustomEnd(resolved.endDate);
  };

  if (!isHydrated) {
    return (
      <main className="app-page">
        <ScreenHeader title="ניתוח פלטפורמות" subtitle="טוען נתונים..." />
      </main>
    );
  }

  return (
    <main className="app-page">
      <ScreenHeader
        title="ניתוח פלטפורמות"
        subtitle="השוואת Wolt, HaAt ו-Ten Bis לפי תקופה — מהמקומי בלבד"
      />

      <DateRangeFilterBar
        preset={preset}
        startDate={range.startDate}
        endDate={range.endDate}
        today={today}
        onPresetChange={onPresetChange}
        onStartDateChange={setCustomStart}
        onEndDateChange={setCustomEnd}
      />

      <PlatformRecommendationCard recommendation={dashboard.recommendation} />

      {!dashboard.hasData ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
          <p className="text-sm text-slate-300">אין עדיין מספיק נתונים לתקופה הזו.</p>
          <Link href="/daily-shift" className="mt-3 inline-block text-sm font-bold text-emerald-300">
            הוסף משמרת יומית →
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          {dashboard.platforms.map((row) => (
            <PlatformAnalyticsCard key={row.platform} row={row} />
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
        <p>
          <strong className="text-slate-300">מקטעים</strong> = כל בלוק עבודה שנרשם במסך היומי. יום טוב/חלש מחושב לפי רווח
          נטו באותו יום לאותה פלטפורמה.
        </p>
      </section>
    </main>
  );
}
