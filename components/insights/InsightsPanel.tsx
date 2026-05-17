"use client";

import InsightCard from "@/components/insights/InsightCard";
import MotivationBanner from "@/components/insights/MotivationBanner";
import WeeklyInsightSummary from "@/components/insights/WeeklyInsightSummary";
import EmptyState from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";
import type { CourierInsightsReport } from "@/types/insights";

type Props = {
  report: CourierInsightsReport;
  showWeekly?: boolean;
  maxItems?: number;
};

export default function InsightsPanel({ report, showWeekly = true, maxItems = 6 }: Props) {
  const { motivation, weekly, warnings, recommendations, insights, topInsight } = report;

  const combined = [...warnings, ...recommendations, ...insights].slice(0, maxItems);

  return (
    <div className="space-y-4">
      <MotivationBanner motivation={motivation} />

      {topInsight ? (
        <section>
          <p className="text-label mb-2 px-1">התובנה המובילה</p>
          <InsightCard insight={topInsight} />
        </section>
      ) : null}

      {showWeekly ? <WeeklyInsightSummary summary={weekly} /> : null}

      {warnings.length > 0 ? (
        <InsightSection title="אזהרות חכמות" items={warnings.slice(0, 3)} />
      ) : null}

      {recommendations.length > 0 ? (
        <InsightSection title="המלצות מותאמות" items={recommendations.slice(0, 4)} />
      ) : null}

      {insights.length > 0 ? <InsightSection title="תובנות" items={insights.slice(0, 4)} /> : null}

      {combined.length === 0 && !report.hasEnoughData ? (
        <EmptyState
          icon={Sparkles}
          title="עדיין אין תובנות"
          description="הוסיפו מקטעי משמרת כדי לפתוח ניתוח AI מבוסס היסטוריה."
        />
      ) : null}
    </div>
  );
}

function InsightSection({ title, items }: { title: string; items: CourierInsightsReport["insights"] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-label px-1">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <InsightCard insight={item} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
