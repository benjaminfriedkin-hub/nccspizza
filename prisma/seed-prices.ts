// Production-safe seed: only creates the default price rows the app needs
// to function. Unlike prisma/seed.ts (used for local dev), this never
// creates fake demo orders/parents — safe to run against a real database
// real families will use.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICE_CENTS, ITEM_LABELS, ITEM_KEYS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (const key of ITEM_KEYS) {
    await prisma.priceSetting.upsert({
      where: { itemKey: key },
      update: {},
      create: { itemKey: key, label: ITEM_LABELS[key], unitPriceCents: DEFAULT_PRICE_CENTS[key] },
    });
  }
  console.log(`Seeded/verified ${ITEM_KEYS.length} price settings. No demo orders created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
