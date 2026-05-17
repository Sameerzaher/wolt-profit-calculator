export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -top-32 right-[-20%] h-72 w-72 rounded-full bg-emerald-500/20 blur-[100px]" />
      <div className="absolute top-1/3 left-[-15%] h-64 w-64 rounded-full bg-sky-500/10 blur-[90px]" />
      <div className="absolute bottom-20 right-[10%] h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_55%)]" />
    </div>
  );
}