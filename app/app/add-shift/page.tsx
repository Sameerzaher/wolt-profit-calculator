"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, Plus } from "lucide-react";
import SegmentEditor from "@/components/courier/SegmentEditor";
import MetricCard from "@/components/courier/MetricCard";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/ui/EmptyState";
import GlassCard from "@/components/ui/GlassCard";
import StickyActionBar from "@/components/ui/StickyActionBar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/motion";
import { calculateDailyTotals } from "@/utils/calculations";
import { PLATFORMS, PLATFORM_LABELS } from "@/types/platform";

export default function AddShiftPage() {
  const {
    isHydrated,
    todayKey,
    vehicle,
    getDayByDate,
    ensureDay,
    saveShiftDay,
    addSegment,
    updateSegment,
    removeSegment
  } = useCourier();

  const [shiftDate, setShiftDate] = useState(todayKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const date = params.get("date");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setShiftDate(date);
    } catch {
      /* ignore */
    }
  }, []);

  const day = getDayByDate(shiftDate);
  const segments = day?.segments ?? [];

  const summary = useMemo(() => {
    if (!day || segments.length === 0) return null;
    return calculateDailyTotals(day, vehicle);
  }, [day, segments, vehicle]);

  const persist = () => {
    if (!day || segments.length === 0) return;
    saveShiftDay(day);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  if (!isHydrated) {
    return <PageSkeleton />;
  }

  return (
    <main className="app-page app-page-sticky">
      <ScreenHeader title="הוספת משמרת" subtitle="מקטעים לפי פלטפורמה" />

      <FadeIn>
        <Link
          href="/app/import-screenshot"
          className="glass-elevated flex min-h-[3.5rem] items-center justify-center gap-2 text-base font-bold text-violet-200"
        >
          <Camera className="h-5 w-5" />
          ייבוא מצילום מסך (OCR)
        </Link>
      </FadeIn>

      <GlassCard>
        <label className="text-label mb-2 block">תאריך</label>
        <input
          type="date"
          value={shiftDate}
          max={todayKey}
          onChange={(e) => setShiftDate(e.target.value || todayKey)}
          className="date-input"
        />
      </GlassCard>

      <GlassCard>
        <p className="text-label mb-3">הוסף מקטע מהיר</p>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => {
                ensureDay(shiftDate);
                addSegment(shiftDate, platform);
              }}
              className="btn-pill btn-pill-idle flex items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </GlassCard>

      {segments.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="אין מקטעים עדיין"
          description="בחרו פלטפורמה למעלה כדי להתחיל, או ייבאו מסך מהאפליקציה."
        />
      ) : (
        <section className="space-y-4">
          {segments.map((segment, index) => (
            <SegmentEditor
              key={segment.id}
              index={index}
              segment={segment}
              vehicle={vehicle}
              onChange={(patch) => updateSegment(shiftDate, segment.id, patch)}
              onRemove={() => removeSegment(shiftDate, segment.id)}
            />
          ))}
        </section>
      )}

      {summary ? (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="סה״כ הכנסה" value={`₪${summary.totalIncome.toFixed(0)}`} accent="emerald" />
          <MetricCard label="רווח נטו" value={`₪${summary.netProfit.toFixed(0)}`} accent="emerald" />
          <MetricCard label="נטו לשעה" value={`₪${summary.netProfitPerHour.toFixed(1)}`} accent="sky" />
          <MetricCard label="ק״מ" value={summary.totalKilometers.toFixed(1)} />
        </div>
      ) : null}

      <StickyActionBar>
        <button
          type="button"
          onClick={persist}
          disabled={segments.length === 0}
          className="btn-primary w-full"
        >
          {saved ? "נשמר ✓" : "שמור משמרת"}
        </button>
      </StickyActionBar>
    </main>
  );
}
