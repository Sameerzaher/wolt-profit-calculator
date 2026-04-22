import type { Decision } from "@/types/models";

const styles: Record<Decision, string> = {
  accept: "bg-emerald-500/20 text-emerald-200 border-emerald-500/60",
  borderline: "bg-amber-500/20 text-amber-200 border-amber-500/60",
  skip: "bg-rose-500/20 text-rose-200 border-rose-500/60"
};

const labels: Record<Decision, string> = {
  accept: "לקחת",
  borderline: "גבולי",
  skip: "לדלג"
};

type Props = {
  decision: Decision;
  score: number;
};

export default function ScoreBadge({ decision, score }: Props) {
  return (
    <div className={`inline-flex min-h-[2.4rem] items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${styles[decision]}`}>
      <span>{labels[decision]}</span>
      <span className="rounded-full bg-black/30 px-2 py-0.5">{score}</span>
    </div>
  );
}
