"use client";

type StickyActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export default function StickyActionBar({ children, className = "" }: StickyActionBarProps) {
  return (
    <div
      className={`fixed bottom-[var(--sticky-action-bottom)] left-0 right-0 z-20 mx-auto max-w-lg px-4 pb-2 ${className}`}
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 shadow-dock backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
