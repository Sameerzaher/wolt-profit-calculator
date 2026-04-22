type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export default function ZoneChipSelector({ label, options, value, onChange }: Props) {
  return (
    <section>
      <p className="mb-2 text-sm font-semibold text-slate-300">{label}</p>
      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`min-h-[2.9rem] shrink-0 snap-start rounded-full border px-4 text-sm font-bold transition active:scale-[0.98] ${
                active
                  ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
