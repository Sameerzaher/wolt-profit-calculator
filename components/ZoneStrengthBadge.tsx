import type { ZoneStrength } from "@/types/models";

const styles: Record<ZoneStrength, string> = {
  strong: "border-emerald-500/50 bg-emerald-500/20 text-emerald-200",
  medium: "border-amber-500/50 bg-amber-500/20 text-amber-200",
  weak: "border-rose-500/50 bg-rose-500/20 text-rose-200"
};

export default function ZoneStrengthBadge({ strength }: { strength: ZoneStrength }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[strength]}`}>{strength}</span>;
}
