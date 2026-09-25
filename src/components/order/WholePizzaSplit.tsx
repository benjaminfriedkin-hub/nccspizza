"use client";

import { Card } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { SLICES_PER_PIZZA } from "@/lib/constants";

interface WholePizzaSplitProps {
  pizzaLabel: string;
  pizzaCount: number;
  people: { key: string; name: string }[];
  slices: Record<string, number>;
  isCustom: boolean;
  onChange: (slices: Record<string, number>) => void;
  onReset: () => void;
}

export function WholePizzaSplit({
  pizzaLabel,
  pizzaCount,
  people,
  slices,
  isCustom,
  onChange,
  onReset,
}: WholePizzaSplitProps) {
  const expected = pizzaCount * SLICES_PER_PIZZA;
  const assigned = people.reduce((t, p) => t + (slices[p.key] ?? 0), 0);
  const ok = assigned === expected;

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-semibold text-stone-800">Sharing your whole pizza?</h2>
      <p className="mt-1 text-xs text-stone-500">
        You ordered {pizzaCount} × {pizzaLabel}. Choose how many of the {expected} slices each person gets — they must
        add up to {expected}. Leave as-is if the person who ordered it keeps it all.
      </p>
      <div className="mt-2 divide-y divide-stone-100">
        {people.map((p) => (
          <NumberStepper
            key={p.key}
            label={p.name}
            priceLabel="slices"
            value={slices[p.key] ?? 0}
            onChange={(v) => onChange({ ...slices, [p.key]: Math.min(v, expected) })}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className={`text-sm font-medium ${ok ? "text-green-700" : "text-amber-700"}`}>
          {ok ? `✓ All ${expected} slices assigned` : `${assigned} of ${expected} slices assigned`}
        </p>
        {isCustom && (
          <button type="button" onClick={onReset} className="text-xs font-medium text-amber-700 underline">
            Reset
          </button>
        )}
      </div>
    </Card>
  );
}
