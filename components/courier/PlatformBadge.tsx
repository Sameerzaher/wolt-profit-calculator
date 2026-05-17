import { PLATFORM_COLORS, PLATFORM_LABELS, type DeliveryPlatform } from "@/types/platform";
import { cn } from "@/lib/cn";

const styles: Record<string, string> = {
  emerald: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
  sky: "border-sky-400/35 bg-sky-500/15 text-sky-100",
  amber: "border-amber-400/35 bg-amber-500/15 text-amber-100"
};

export default function PlatformBadge({ platform }: { platform: DeliveryPlatform }) {
  const tone = PLATFORM_COLORS[platform];
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 text-sm font-bold backdrop-blur-sm",
        styles[tone]
      )}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
}
