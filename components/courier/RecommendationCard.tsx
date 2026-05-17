import PlatformBadge from "@/components/courier/PlatformBadge";
import GlassCard from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/ui/motion";
import type { DeliveryPlatform } from "@/types/platform";
import { Lightbulb } from "lucide-react";

type RecommendationCardProps = {
  title: string;
  message: string;
  platform?: DeliveryPlatform | null;
  netPerHour?: number;
};

export default function RecommendationCard({ title, message, platform, netPerHour }: RecommendationCardProps) {
  return (
    <FadeIn delay={0.1}>
      <GlassCard variant="strong" className="relative overflow-hidden">
        <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="relative flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15">
            <Lightbulb className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug text-white">{title}</p>
            <p className="mt-2 text-base leading-relaxed text-slate-300">{message}</p>
            {platform && netPerHour !== undefined ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <PlatformBadge platform={platform} />
                <p className="text-xl font-extrabold text-emerald-300" dir="ltr">
                  ₪{netPerHour.toFixed(1)}/שעה
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
