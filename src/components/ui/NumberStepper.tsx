interface NumberStepperProps {
  label: string;
  priceLabel: string;
  value: number;
  onChange: (value: number) => void;
}

export function NumberStepper({ label, priceLabel, value, onChange }: NumberStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs text-stone-500">{priceLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
          disabled={value <= 0}
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
        >
          +
        </button>
      </div>
    </div>
  );
}
