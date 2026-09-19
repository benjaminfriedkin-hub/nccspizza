import { prisma } from "./prisma";
import { DEFAULT_PRICE_CENTS, ITEM_KEYS, ITEM_LABELS, type ItemKey } from "./constants";

export type PriceMap = Record<ItemKey, number>;
export type LabelMap = Record<ItemKey, string>;

export interface PriceSettings {
  price: PriceMap;
  label: LabelMap;
}

/** Current prices + descriptions, falling back to defaults for any missing key. */
export async function getCurrentPriceSettings(): Promise<PriceSettings> {
  const rows = await prisma.priceSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.itemKey, r]));
  const price = {} as PriceMap;
  const label = {} as LabelMap;
  for (const key of ITEM_KEYS) {
    const row = byKey.get(key);
    price[key] = row?.unitPriceCents ?? DEFAULT_PRICE_CENTS[key];
    label[key] = row?.label ?? ITEM_LABELS[key];
  }
  return { price, label };
}

/** Current prices in cents, falling back to defaults for any missing key. */
export async function getCurrentPrices(): Promise<PriceMap> {
  return (await getCurrentPriceSettings()).price;
}

export async function setPriceSetting(
  itemKey: ItemKey,
  updates: { unitPriceCents?: number; label?: string }
) {
  return prisma.priceSetting.upsert({
    where: { itemKey },
    update: {
      ...(updates.unitPriceCents !== undefined && { unitPriceCents: updates.unitPriceCents }),
      ...(updates.label !== undefined && { label: updates.label }),
    },
    create: {
      itemKey,
      unitPriceCents: updates.unitPriceCents ?? DEFAULT_PRICE_CENTS[itemKey],
      label: updates.label ?? ITEM_LABELS[itemKey],
    },
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
