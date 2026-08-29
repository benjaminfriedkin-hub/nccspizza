import { Card } from "@/components/ui/Card";
import { ITEM_LABELS, studentTotalCents, type PriceMap, type StudentForm } from "./shared";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const LINE_ITEM_KEYS = [
  ["cheeseSlices", "cheeseSlice"],
  ["pepperoniSlices", "pepperoniSlice"],
  ["wholeCheese", "wholeCheese"],
  ["wholePepperoni", "wholePepperoni"],
  ["breadsticks", "breadsticks"],
  ["snacks", "snack"],
  ["drinks", "drink"],
] as const;

export function OrderSummary({ students, prices }: { students: StudentForm[]; prices: PriceMap }) {
  const total = students.reduce((t, s) => t + studentTotalCents(s, prices), 0);
  const hasAnyItems = students.some((s) => studentTotalCents(s, prices) > 0);

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-stone-700">Order summary</h3>
      {!hasAnyItems ? (
        <p className="text-sm text-stone-500">Add items above to see your total.</p>
      ) : (
        <div className="space-y-3">
          {students.map((s, i) => {
            const lineTotal = studentTotalCents(s, prices);
            if (lineTotal === 0) return null;
            return (
              <div key={s.key} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-stone-800">
                  {s.studentName.trim() || `Student ${i + 1}`}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                  {LINE_ITEM_KEYS.map(([qtyKey, priceKey]) => {
                    const qty = s[qtyKey];
                    if (!qty) return null;
                    return (
                      <li key={qtyKey} className="flex justify-between">
                        <span>
                          {qty} × {ITEM_LABELS[priceKey]}
                        </span>
                        <span className="tabular-nums">{formatCents(qty * prices[priceKey])}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3">
        <span className="text-sm font-semibold text-stone-800">Total</span>
        <span className="text-lg font-bold text-amber-700 tabular-nums">{formatCents(total)}</span>
      </div>
    </Card>
  );
}
