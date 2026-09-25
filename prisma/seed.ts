import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICE_CENTS, ITEM_LABELS, ITEM_KEYS } from "../src/lib/constants";
import { getFridayOfWeek, getNextOrderableFriday } from "../src/lib/friday";
import { computeOrderTotalCents, type StudentQuantities } from "../src/lib/pricing";

const prisma = new PrismaClient();

function student(overrides: Partial<StudentQuantities> & { firstName: string; lastName: string; grade: string }) {
  return withWholeSlices({
    cheeseSlices: 0,
    pepperoniSlices: 0,
    wholeCheese: 0,
    wholePepperoni: 0,
    breadsticks: 0,
    snacks: 0,
    drinks: 0,
    ...overrides,
  });
}

function withWholeSlices<T extends { wholeCheese: number; wholePepperoni: number }>(s: T) {
  return { ...s, cheeseSlicesFromWhole: s.wholeCheese * 8, pepperoniSlicesFromWhole: s.wholePepperoni * 8 };
}

async function main() {
  await prisma.orderStudent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.mockEmail.deleteMany();
  await prisma.skippedFriday.deleteMany();
  await prisma.priceSetting.deleteMany();

  for (const key of ITEM_KEYS) {
    await prisma.priceSetting.create({
      data: { itemKey: key, label: ITEM_LABELS[key], unitPriceCents: DEFAULT_PRICE_CENTS[key] },
    });
  }
  console.log(`Seeded ${ITEM_KEYS.length} price settings.`);

  const now = new Date();
  const twoWeeksOut = getFridayOfWeek(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));
  await prisma.skippedFriday.create({
    data: { date: twoWeeksOut, reason: "Sample holiday — no pizza this week" },
  });
  console.log(`Seeded 1 skipped Friday (${twoWeeksOut.toDateString()}).`);

  const upcoming = getNextOrderableFriday(now, [twoWeeksOut]);
  if (upcoming) {
    const prices = DEFAULT_PRICE_CENTS;
    const priceSnapshot = {
      cheeseSlicePriceCents: prices.cheeseSlice,
      pepperoniSlicePriceCents: prices.pepperoniSlice,
      wholeCheesePriceCents: prices.wholeCheese,
      wholePepperoniPriceCents: prices.wholePepperoni,
      breadstickPriceCents: prices.breadsticks,
      snackPriceCents: prices.snack,
      drinkPriceCents: prices.drink,
    };

    const order1Students = [
      student({ firstName: "Ava", lastName: "Johnson", grade: "2", cheeseSlices: 2, breadsticks: 1 }),
      student({ firstName: "Noah", lastName: "Johnson", grade: "4", pepperoniSlices: 2, breadsticks: 1, snacks: 1 }),
    ];
    await prisma.order.create({
      data: {
        fridayDate: upcoming.friday,
        parentName: "Jamie Johnson",
        parentEmail: "jamie.johnson@example.com",
        parentPhone: "555-0101",
        totalAmountCents: computeOrderTotalCents(order1Students, prices),
        paymentStatus: "paid",
        paymentMode: "mock",
        ...priceSnapshot,
        students: { create: order1Students },
      },
    });

    const order2Students = [student({ firstName: "Liam", lastName: "Rodriguez", grade: "K", wholeCheese: 1 })];
    await prisma.order.create({
      data: {
        fridayDate: upcoming.friday,
        parentName: "Priya Rodriguez",
        parentEmail: "priya.rodriguez@example.com",
        parentPhone: null,
        totalAmountCents: computeOrderTotalCents(order2Students, prices),
        paymentStatus: "paid",
        paymentMode: "mock",
        ...priceSnapshot,
        students: { create: order2Students },
      },
    });

    // A secondary-grade (6-12) student, to exercise the drink option.
    const order3Students = [
      student({ firstName: "Ethan", lastName: "Chen", grade: "8", wholePepperoni: 1, snacks: 1, drinks: 2 }),
    ];
    await prisma.order.create({
      data: {
        fridayDate: upcoming.friday,
        parentName: "Wei Chen",
        parentEmail: "wei.chen@example.com",
        parentPhone: "555-0142",
        totalAmountCents: computeOrderTotalCents(order3Students, prices),
        paymentStatus: "paid",
        paymentMode: "mock",
        ...priceSnapshot,
        students: { create: order3Students },
      },
    });

    console.log(`Seeded 3 demo orders for ${upcoming.friday.toDateString()}.`);
  }

  console.log("\nAdmin login: see ADMIN_PASSWORD_HASH in .env (dev default password: pizza2026)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
