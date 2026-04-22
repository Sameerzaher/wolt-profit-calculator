type Props = {
  label: string;
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function QuickInputField({ label, type = "text", value, onChange, placeholder }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[3.2rem] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-base font-semibold text-white outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:ring-2"
      />
    </label>
  );
}
