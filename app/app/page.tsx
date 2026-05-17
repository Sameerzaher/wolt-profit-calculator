"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BarChart3,
  Camera,
  Car,
  Sparkles,
  TrendingUp,
  Wallet
} from "lucide-react";
import MetricCard from "@/components/courier/MetricCard";
import PlatformBadge from "@/components/courier/PlatformBadge";
import RecommendationCard from "@/components/courier/RecommendationCard";
import InsightTeaser from "@/components/insights/InsightTeaser";
import { useCourier } from "@/components/CourierProvider";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/ui/EmptyState";
import GlassCard from "@/components/ui/GlassCard";
import QuickAction from "@/components/ui/QuickAction";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { buildCourierInsights } from "@/lib/insights";
import { ROUTES } from "@/lib/routes";
import { PLATFORM_LABELS } from "@/types/platform";

export default function AppHomePage() {
  const { isHydrated, todaySummary, weeklySummary, shiftDays, vehicle } = useCourier();

  const insightsReport = useMemo(
    () => (isHydrated ? buildCourierInsights(shiftDays, vehicle) : null),
    [isHydrated, shiftDays, vehicle]
  );

  if (!isHydrated) {
    return <DashboardSkeleton />;
  }

  const summary = todaySummary;
  const hasData = Boolean(summary && summary.totalIncome > 0);

  return (
    <main className="app-page">
      <ScreenHeader title="לוח בקרה" subtitle="הרווח האמיתי שלך — כל הפלטפורמות" />

      <FadeIn>
        <GlassCard variant="strong" padding="lg" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-500/25 blur-3xl" aria-hidden />
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">DeliveryCalc</p>
          <h2 className="mt-2 text-display-sm text-white">שלום, שליח/ה</h2>
          <p className="mt-2 text-base text-slate-400">Wolt · Ten Bis · HaAt</p>
        </GlassCard>
      </FadeIn>

      {hasData && summary ? (
        <Stagger className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="הכנסה היום"
              value={`₪${summary.totalIncome.toFixed(0)}`}
              accent="emerald"
              large
              icon={<Wallet className="h-5 w-5" />}
            />
            <MetricCard
              label="רווח נטו"
              value={`₪${summary.netProfit.toFixed(0)}`}
              accent="emerald"
              large
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <MetricCard label="₪ לשעה (נטו)" value={`₪${summary.netProfitPerHour.toFixed(1)}`} accent="sky" />
            <MetricCard label="ק״מ" value={summary.totalKilometers.toFixed(1)} accent="white" />
          </div>

          {summary.bestPlatform ? (
            <StaggerItem>
              <GlassCard className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label">הפלטפורמה הכי משתלמת היום</p>
                  <p className="mt-1 text-xl font-bold text-white">{PLATFORM_LABELS[summary.bestPlatform]}</p>
                </div>
                <PlatformBadge platform={summary.bestPlatform} />
              </GlassCard>
            </StaggerItem>
          ) : null}

          <RecommendationCard
            title="באיזו אפליקציה הכי משתלם לך?"
            message={summary.recommendation}
            platform={summary.bestPlatform}
            netPerHour={summary.netProfitPerHour}
          />
        </Stagger>
      ) : (
        <EmptyState
          icon={Wallet}
          title="אין עדיין נתונים להיום"
          description="הוסיפו משמרת או ייבאו צילום מסך מהאפליקציה — לוקח פחות מדקה."
          action={
            <Link href={ROUTES.appAddShift} className="btn-primary w-full">
              הוסף משמרת
            </Link>
          }
        />
      )}

      <FadeIn delay={0.15}>
        <p className="text-label mb-3 px-1">פעולות מהירות</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction href={ROUTES.appAddShift} label="משמרת" icon={TrendingUp} tone="emerald" />
          <QuickAction href={ROUTES.dashboard} label="ניתוחים" icon={BarChart3} tone="sky" />
          <QuickAction href={ROUTES.appImportScreenshot} label="ייבוא מסך" icon={Camera} tone="violet" />
          <QuickAction href={ROUTES.appVehicleSettings} label="הגדרות רכב" icon={Car} tone="neutral" />
        </div>
      </FadeIn>

      {insightsReport ? (
        <FadeIn delay={0.2}>
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <p className="text-label">תובנה חכמה</p>
          </div>
          <InsightTeaser report={insightsReport} />
        </FadeIn>
      ) : null}

      {weeklySummary.byPlatform.length > 0 ? (
        <FadeIn delay={0.25}>
          <GlassCard>
            <p className="text-label">תמצית השבוע</p>
            <p className="mt-2 text-2xl font-extrabold text-white" dir="ltr">
              ₪{weeklySummary.totals.netProfit.toFixed(0)}
              <span className="text-base font-semibold text-slate-500"> נטו</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{weeklySummary.daysWorked} ימי עבודה</p>
          </GlassCard>
        </FadeIn>
      ) : null}
    </main>
  );
}
