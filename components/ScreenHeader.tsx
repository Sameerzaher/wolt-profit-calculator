type Props = {
  title: string;
  subtitle: string;
};

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-black text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </header>
  );
}
