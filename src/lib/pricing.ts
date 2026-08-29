import { prisma } from "./prisma";
import { DEFAULT_PRICE_CENTS, ITEM_KEYS, ITEM_LABELS, type ItemKey } from "./constants";

export type PriceMap = Record<ItemKey, number>;

/** Current prices in cents, falling back to defaults for any missing key. */
export async function getCurrentPrices(): Promise<PriceMap> {
  const rows = await prisma.priceSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.itemKey, r.unitPriceCents]));
  const prices = {} as PriceMap;
  for (const key of ITEM_KEYS) {
    prices[key] = byKey.get(key) ?? DEFAULT_PRICE_CENTS[key];
  }
  return prices;
}

export async function setPrice(itemKey: ItemKey, unitPriceCents: number) {
  return prisma.priceSetting.upsert({
    where: { itemKey },
    update: { unitPriceCents },
    create: { itemKey, unitPriceCents, label: ITEM_LABELS[itemKey] },
  });
}

export interface StudentQuantities {
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  breadsticks: number;
  snacks: number;
  drinks: number;
}

export function computeStudentTotalCents(q: StudentQuantities, prices: PriceMap): number {
  return (
    q.cheeseSlices * prices.cheeseSlice +
    q.pepperoniSlices * prices.pepperoniSlice +
    q.wholeCheese * prices.wholeCheese +
    q.wholePepperoni * prices.wholePepperoni +
    q.breadsticks * prices.breadsticks +
    q.snacks * prices.snack +
    q.drinks * prices.drink
  );
}

export function computeOrderTotalCents(students: StudentQuantities[], prices: PriceMap): number {
  return students.reduce((total, s) => total + computeStudentTotalCents(s, prices), 0);
}
