"use client";

import type { DeliveryPlatform } from "@/types/models";
import { DELIVERY_PLATFORMS, PLATFORM_COLORS, PLATFORM_LABELS } from "@/src/types/delivery-platform";

type PlatformSelectorProps = {
  value: DeliveryPlatform;
  onChange: (platform: DeliveryPlatform) => void;
};

const colorClasses: Record<string, { active: string; idle: string }> = {
  emerald: {
    active: "border-emerald-400 bg-emerald-500/25 text-emerald-100",
    idle: "border-slate-700 bg-slate-950 text-slate-300"
  },
  sky: {
    active: "border-sky-400 bg-sky-500/25 text-sky-100",
    idle: "border-slate-700 bg-slate-950 text-slate-300"
  },
  amber: {
    active: "border-amber-400 bg-amber-500/25 text-amber-100",
    idle: "border-slate-700 bg-slate-950 text-slate-300"
  }
};

export default function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DELIVERY_PLATFORMS.map((platform) => {
        const selected = value === platform;
        const tone = PLATFORM_COLORS[platform];
        const styles = colorClasses[tone] ?? colorClasses.emerald;
        return (
          <button
            key={platform}
            type="button"
            onClick={() => onChange(platform)}
            className={`min-h-[2.75rem] rounded-xl border px-2 py-2 text-xs font-bold transition sm:text-sm ${
              selected ? styles.active : styles.idle
            }`}
          >
            {PLATFORM_LABELS[platform]}
          </button>
        );
      })}
    </div>
  );
}
