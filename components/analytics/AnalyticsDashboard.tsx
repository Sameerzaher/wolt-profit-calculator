"use client";

import { useMemo, useState } from "react";
import HourlyHeatmap from "@/components/analytics/HourlyHeatmap";
import InsightCards from "@/components/analytics/InsightCards";
import InsightsList from "@/components/analytics/InsightsList";
import InsightsPanel from "@/components/insights/InsightsPanel";
import { buildCourierInsights } from "@/lib/insights";
import PeriodTabs from "@/components/analytics/PeriodTabs";
import PlatformComparisonSection from "@/components/analytics/PlatformComparisonSection";
import TrendChart from "@/components/analytics/TrendChart";
import MetricCard from "@/components/courier/MetricCard";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { BarChart3 } from "lucide-react";
import type { AnalyticsPeriod } from "@/types/analytics";
import { buildAnalyticsReport } from "@/utils/analyticsEngine";
import { formatHebrewDate } from "@/utils/dates";

const PERIOD_TITLES: Record<AnalyticsPeriod, string> = {
  week: "ניתוח שבועי",
  month: "ניתוח חודשי",
  all: "ניתוח מצטבר"
};

export default function AnalyticsDashboard({ initialPeriod = "week" }: { initialPeriod?: AnalyticsPeriod }) {
  const { isHydrated, shiftDays, vehicle } = useCourier();
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod);

  const report = useMemo(
    () => (isHydrated ? buildAnalyticsReport(shiftDays, vehicle, period) : null),
    [isHydrated, shiftDays, vehicle, period]
  );

  const courierInsights = useMemo(
    () => (isHydrated && period === "week" ? buildCourierInsights(shiftDays, vehicle) : null),
    [isHydrated, shiftDays, vehicle, period]
  );

  if (!isHydrated || !report) {
    return <PageSkeleton />;
  }

  const hasData = report.totals.totalShifts > 0;
  const rangeLabel =
    period === "all" && report.daysWorked > 0
      ? `${formatHebrewDate(report.startDate)} → ${formatHebrewDate(report.endDate)}`
      : `${formatHebrewDate(report.startDate)} → ${formatHebrewDate(report.endDate)}`;

  return (
    <main className="app-page space-y-4">
      <ScreenHeader
        title={PERIOD_TITLES[period]}
        subtitle={`${rangeLabel} · ${report.daysWorked} ימי עבודה`}
      />

      <PeriodTabs value={period} onChange={setPeriod} />

      {hasData ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <MetricCard label="הכנסה" value={`₪${report.totals.totalIncome.toFixed(0)}`} accent="emerald" large />
            <MetricCard label="רווח נטו" value={`₪${report.totals.netProfit.toFixed(0)}`} accent="emerald" large />
            <MetricCard label="נטו לשעה" value={`₪${report.totals.netProfitPerHour.toFixed(1)}`} accent="sky" />
            <MetricCard label="שעות" value={report.totals.totalHours.toFixed(1)} />
          </section>

          <InsightCards report={report} />

          <section className="space-y-4">
            <h2 className="text-label px-1">מגמות רווח</h2>
            <TrendChart title="מגמת הכנסה" data={report.trends} metric="income" />
            <TrendChart title="מגמת רווח נטו" data={report.trends} metric="netProfit" />
            <TrendChart title="מגמת קילומטרים" data={report.trends} metric="kilometers" />
            <TrendChart title="מגמת ₪ לשעה (נטו)" data={report.trends} metric="netProfitPerHour" />
          </section>

          <PlatformComparisonSection report={report} />

          <HourlyHeatmap cells={report.heatmap} />

          {courierInsights ? (
            <InsightsPanel report={courierInsights} showWeekly={false} maxItems={5} />
          ) : (
            <InsightsList insights={report.insights} />
          )}
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="אין נתונים לתקופה"
          description="הוסיפו מקטעי משמרת כדי לפתוח גרפים, השוואות פלטפורמות ותובנות."
        />
      )}
    </main>
  );
}
