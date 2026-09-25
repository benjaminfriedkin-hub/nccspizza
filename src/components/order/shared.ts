import type { ItemKey } from "@/lib/constants";

export type PriceMap = Record<ItemKey, number>;
export type LabelMap = Record<ItemKey, string>;

export interface StudentForm {
  key: string;
  firstName: string;
  lastName: string;
  grade: string;
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  breadsticks: number;
  snacks: number;
  drinks: number;
}

export function emptyStudent(key: string): StudentForm {
  return {
    key,
    firstName: "",
    lastName: "",
    grade: "",
    cheeseSlices: 0,
    pepperoniSlices: 0,
    wholeCheese: 0,
    wholePepperoni: 0,
    breadsticks: 0,
    snacks: 0,
    drinks: 0,
  };
}

export function studentTotalCents(s: StudentForm, prices: PriceMap): number {
  return (
    s.cheeseSlices * prices.cheeseSlice +
    s.pepperoniSlices * prices.pepperoniSlice +
    s.wholeCheese * prices.wholeCheese +
    s.wholePepperoni * prices.wholePepperoni +
    s.breadsticks * prices.breadsticks +
    s.snacks * prices.snack +
    s.drinks * prices.drink
  );
}

/** Display name for a person on the order, falling back to their card title before a name is typed. */
export function personName(s: StudentForm, index: number): string {
  const typed = `${s.firstName} ${s.lastName}`.trim();
  if (typed) return typed;
  if (s.grade === "Teacher" || s.grade === "Parent") return s.grade;
  return `Student ${index + 1}`;
}
