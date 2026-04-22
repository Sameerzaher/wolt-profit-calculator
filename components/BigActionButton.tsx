import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle: string;
};

export default function BigActionButton({ href, title, subtitle }: Props) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/25 to-slate-900 px-4 py-4 shadow-lg shadow-emerald-950/30 transition active:scale-[0.99]"
    >
      <p className="text-lg font-extrabold text-emerald-200">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </Link>
  );
}
