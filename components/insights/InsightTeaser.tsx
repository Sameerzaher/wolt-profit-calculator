"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CourierInsightsReport } from "@/types/insights";
import InsightCard from "@/components/insights/InsightCard";
import { ROUTES } from "@/lib/routes";

export default function InsightTeaser({ report }: { report: CourierInsightsReport }) {
  return (
    <section className="space-y-3">
      {report.topInsight ? <InsightCard insight={report.topInsight} compact /> : null}
      <Link
        href={ROUTES.appCourierInsights}
        className="glass-elevated flex min-h-[3.25rem] items-center justify-center gap-2 text-base font-bold text-violet-200"
      >
        כל התובנות וההמלצות
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </section>
  );
}
