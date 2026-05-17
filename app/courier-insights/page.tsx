"use client";

import { useMemo } from "react";
import InsightsPanel from "@/components/insights/InsightsPanel";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { buildCourierInsights } from "@/lib/insights";

export default function CourierInsightsPage() {
  const { isHydrated, shiftDays, vehicle } = useCourier();

  const report = useMemo(
    () => (isHydrated ? buildCourierInsights(shiftDays, vehicle) : null),
    [isHydrated, shiftDays, vehicle]
  );

  if (!isHydrated || !report) {
    return <PageSkeleton />;
  }

  return (
    <main className="app-page">
      <ScreenHeader title="תובנות חכמות" subtitle="ניתוח עסקי מהיסטוריית המשמרות שלך" />
      <InsightsPanel report={report} maxItems={12} />
    </main>
  );
}
