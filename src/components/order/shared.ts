import { ITEM_LABELS, type ItemKey } from "@/lib/constants";

export { ITEM_LABELS };
export type PriceMap = Record<ItemKey, number>;

export interface StudentForm {
  key: string;
  studentName: string;
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
    studentName: "",
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
