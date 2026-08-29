export const ITEM_KEYS = [
  "cheeseSlice",
  "pepperoniSlice",
  "wholeCheese",
  "wholePepperoni",
  "breadsticks",
  "snack",
  "drink",
] as const;

export type ItemKey = (typeof ITEM_KEYS)[number];

export const ITEM_LABELS: Record<ItemKey, string> = {
  cheeseSlice: "Cheese pizza slice",
  pepperoniSlice: "Pepperoni pizza slice",
  wholeCheese: "Whole cheese pizza (8 slices)",
  wholePepperoni: "Whole pepperoni pizza (8 slices)",
  breadsticks: "Garlic cheese breadsticks (1 order)",
  snack: "Snack",
  drink: "Drink",
};

// Defaults used only when a PriceSetting row is missing (e.g. first run
// before seeding, or a key that hasn't been created yet).
export const DEFAULT_PRICE_CENTS: Record<ItemKey, number> = {
  cheeseSlice: 200,
  pepperoniSlice: 200,
  wholeCheese: 1200,
  wholePepperoni: 1200,
  breadsticks: 300,
  snack: 75,
  drink: 100,
};

export const SLICES_PER_PIZZA = 8;

export const SCHOOL_TIMEZONE = process.env.SCHOOL_TIMEZONE || "America/New_York";

// Grade K-12, in order. Value is what's stored on the order; label is what's
// shown in the dropdown.
export const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
];

export const GRADE_VALUES = GRADE_OPTIONS.map((g) => g.value);

// Secondary = grades 6-12. Drives which students the drink option is offered to.
export function isSecondaryGrade(grade: string): boolean {
  const n = Number(grade);
  return Number.isInteger(n) && n >= 6 && n <= 12;
}

export function gradeLabel(grade: string): string {
  return GRADE_OPTIONS.find((g) => g.value === grade)?.label ?? grade;
}
