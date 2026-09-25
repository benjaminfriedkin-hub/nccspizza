import { SLICES_PER_PIZZA } from "./constants";

export type WholePizzaType = "cheese" | "pepperoni";

export interface WholeShareFields {
  wholeCheese: number;
  wholePepperoni: number;
  cheeseSlicesFromWhole: number;
  pepperoniSlicesFromWhole: number;
}

const TYPE_FIELDS = {
  cheese: { whole: "wholeCheese", slices: "cheeseSlicesFromWhole" },
  pepperoni: { whole: "wholePepperoni", slices: "pepperoniSlicesFromWhole" },
} as const;

export interface CustomAllocation {
  // Number of whole pizzas this split was made for; if it changes, the split is stale.
  forTotal: number;
  slices: Record<string, number>;
}

/**
 * Slices each person gets from the order's whole pizzas of one type. Unless the
 * parent has made a split that still matches the current pizza count, each
 * buyer keeps all 8 slices of every whole pizza they bought.
 */
export function resolveSlices(
  people: { key: string; whole: number }[],
  custom: CustomAllocation | null
): Record<string, number> {
  const total = people.reduce((t, p) => t + p.whole, 0);
  const useCustom = custom !== null && custom.forTotal === total;
  return Object.fromEntries(
    people.map((p) => [p.key, useCustom ? custom.slices[p.key] ?? 0 : p.whole * SLICES_PER_PIZZA])
  );
}

export function validateWholeAllocation(people: WholeShareFields[]): string | null {
  for (const type of ["cheese", "pepperoni"] as const) {
    const { whole, slices } = TYPE_FIELDS[type];
    if (!people.every((p) => Number.isInteger(p[slices]) && p[slices] >= 0)) {
      return "Whole pizza slices must be whole numbers, 0 or greater.";
    }
    const expected = people.reduce((t, p) => t + p[whole], 0) * SLICES_PER_PIZZA;
    const assigned = people.reduce((t, p) => t + p[slices], 0);
    if (assigned !== expected) {
      return `The whole ${type} pizza slices must add up to ${SLICES_PER_PIZZA} per pizza (currently ${assigned} of ${expected}).`;
    }
  }
  return null;
}

/**
 * One note per person (aligned with `people`) describing how a shared whole
 * pizza was split, or "" when nothing on the order is shared.
 */
export function shareNotes(people: (WholeShareFields & { name: string })[]): string[] {
  const segments: string[][] = people.map(() => []);
  for (const type of ["cheese", "pepperoni"] as const) {
    const { whole, slices } = TYPE_FIELDS[type];
    const shared = people.some((p) => p[slices] !== p[whole] * SLICES_PER_PIZZA);
    if (!shared) continue;
    const split = people
      .filter((p) => p[slices] > 0)
      .map((p) => `${p.name} ${p[slices]} slice${p[slices] === 1 ? "" : "s"}`)
      .join(", ");
    people.forEach((p, i) => {
      if (p[slices] > 0 || p[whole] > 0) segments[i].push(`Whole ${type} pizza split: ${split}`);
    });
  }
  return segments.map((s) => s.join("; "));
}

/** Lines describing a person's share of a whole pizza that isn't simply "all of the ones they bought". */
export function sharedSliceLines(
  s: WholeShareFields,
  names: { cheese: string; pepperoni: string }
): string[] {
  const lines: string[] = [];
  for (const type of ["cheese", "pepperoni"] as const) {
    const { whole, slices } = TYPE_FIELDS[type];
    const n = s[slices];
    if (n !== s[whole] * SLICES_PER_PIZZA && n > 0) {
      lines.push(`${n} slice${n === 1 ? "" : "s"} of the shared ${names[type]}`);
    }
  }
  return lines;
}
