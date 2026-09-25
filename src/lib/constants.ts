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

// Each parent-facing breadstick ($1) is one piece; Pizza Hut sells breadsticks
// in orders of 10 pieces. Purchase orders = ceil(pieces / 10).
export const BREADSTICK_PIECES_PER_PARENT_ORDER = 1;
export const BREADSTICK_PIECES_PER_PURCHASE_ORDER = 10;

export const SCHOOL_TIMEZONE = process.env.SCHOOL_TIMEZONE || "America/New_York";

// Grade K-12 plus non-student roles, in order. Value is what's stored on the
// order; label is what's shown in the dropdown.
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
  { value: "Teacher", label: "Teacher" },
  { value: "Parent", label: "Parent" },
];

export const GRADE_VALUES = GRADE_OPTIONS.map((g) => g.value);

// Grade bands used to split the admin Excel export into four files.
export const GRADE_BAND_K_TO_2 = ["K", "1", "2"];
export const GRADE_BAND_3_TO_5 = ["3", "4", "5"];
export const GRADE_BAND_6_TO_12 = ["6", "7", "8", "9", "10", "11", "12"];
export const GRADE_BAND_TEACHERS_PARENTS = ["Teacher", "Parent"];

export const EXPORT_GROUPS = [
  { key: "k2", label: "K–2" },
  { key: "3to5", label: "3–5" },
  { key: "6to12", label: "6–12" },
  { key: "teachersParents", label: "Teachers + Parents" },
] as const;

export type ExportGroupKey = (typeof EXPORT_GROUPS)[number]["key"];

// Secondary = grades 6-12, plus teachers/parents ordering for themselves.
// Drives which students the drink option is offered to.
export function isSecondaryGrade(grade: string): boolean {
  if (grade === "Teacher" || grade === "Parent") return true;
  const n = Number(grade);
  return Number.isInteger(n) && n >= 6 && n <= 12;
}

export function gradeLabel(grade: string): string {
  return GRADE_OPTIONS.find((g) => g.value === grade)?.label ?? grade;
}

/** Sort rank for a grade value, in the same order as GRADE_OPTIONS. */
export function gradeRank(grade: string): number {
  const i = GRADE_VALUES.indexOf(grade);
  return i === -1 ? GRADE_VALUES.length : i;
}

// Standing weekly buffer: bought every week regardless of what's ordered
// online (e.g. staff/walk-up margin), added into the admin dashboard's
// "needed" counts but never tied to any specific order or parent.
export const WEEKLY_BUFFER = {
  cheesePizzas: 1,
  pepperoniPizzas: 1,
  breadsticks: 1,
} as const;
