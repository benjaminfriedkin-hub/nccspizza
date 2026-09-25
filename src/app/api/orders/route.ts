import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUpcomingFriday } from "@/lib/friday";
import { getCurrentPriceSettings, computeOrderTotalCents, type StudentQuantities } from "@/lib/pricing";
import { chargeOrder } from "@/lib/square";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { ITEM_KEYS, GRADE_VALUES, isSecondaryGrade, SLICES_PER_PIZZA } from "@/lib/constants";
import { validateWholeAllocation, sharedSliceLines } from "@/lib/wholePizza";

interface StudentInput extends StudentQuantities {
  firstName: string;
  lastName: string;
  grade: string;
  // Slices of the order's whole pizzas this person eats. Optional: when
  // omitted, each buyer keeps all of their own whole pizzas.
  cheeseSlicesFromWhole?: number;
  pepperoniSlicesFromWhole?: number;
}

interface OrderRequestBody {
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  students?: StudentInput[];
  sourceId?: string;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function validateStudent(s: Partial<StudentInput>): string | null {
  if (!s.firstName || typeof s.firstName !== "string" || !s.firstName.trim()) {
    return "Each student needs a first name.";
  }
  if (!s.lastName || typeof s.lastName !== "string" || !s.lastName.trim()) {
    return "Each student needs a last name.";
  }
  const fullName = `${s.firstName} ${s.lastName}`;
  if (!s.grade || typeof s.grade !== "string" || !GRADE_VALUES.includes(s.grade)) {
    return "Each student needs a valid grade.";
  }
  const quantities = [
    s.cheeseSlices,
    s.pepperoniSlices,
    s.wholeCheese,
    s.wholePepperoni,
    s.breadsticks,
    s.snacks,
    s.drinks,
  ];
  if (!quantities.every(isNonNegativeInt)) {
    return "Item quantities must be whole numbers, 0 or greater.";
  }
  const sharedSlices = [s.cheeseSlicesFromWhole ?? 0, s.pepperoniSlicesFromWhole ?? 0];
  if (quantities.every((q) => (q as number) === 0) && sharedSlices.every((q) => q === 0)) {
    return `${fullName} has no items selected.`;
  }
  if ((s.drinks as number) > 0 && !isSecondaryGrade(s.grade)) {
    return `${fullName}: drinks are only available for secondary students (grades 6-12), teachers, and parents.`;
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: OrderRequestBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body.");
  }

  if (!body.parentName?.trim()) return badRequest("Parent name is required.");
  if (!body.parentEmail?.trim()) return badRequest("Parent email is required.");
  if (!body.students || body.students.length === 0) {
    return badRequest("Add at least one student to the order.");
  }
  for (const s of body.students) {
    const error = validateStudent(s);
    if (error) return badRequest(error);
  }

  const anySplit = body.students.some(
    (s) => s.cheeseSlicesFromWhole !== undefined || s.pepperoniSlicesFromWhole !== undefined
  );
  const people = body.students.map((s) => ({
    wholeCheese: s.wholeCheese,
    wholePepperoni: s.wholePepperoni,
    cheeseSlicesFromWhole: anySplit ? s.cheeseSlicesFromWhole ?? 0 : s.wholeCheese * SLICES_PER_PIZZA,
    pepperoniSlicesFromWhole: anySplit ? s.pepperoniSlicesFromWhole ?? 0 : s.wholePepperoni * SLICES_PER_PIZZA,
  }));
  const splitError = validateWholeAllocation(people);
  if (splitError) return badRequest(splitError);

  const skippedRows = await prisma.skippedFriday.findMany();
  const skippedDates = skippedRows.map((r) => r.date);
  const window = getUpcomingFriday(new Date(), skippedDates);

  if (!window.orderingOpen) {
    return badRequest(
      window.isSkipped
        ? "There is no pizza lunch this Friday — ordering is closed."
        : "Ordering is closed for this week (the Wednesday 11:59 PM cutoff has passed)."
    );
  }

  const { price: prices, label: labels } = await getCurrentPriceSettings();
  const totalAmountCents = computeOrderTotalCents(body.students, prices);
  const orderId = randomUUID();

  const chargeResult = await chargeOrder({
    idempotencyKey: orderId,
    amountCents: totalAmountCents,
    sourceId: body.sourceId,
  });

  if (chargeResult.paymentStatus === "failed") {
    return NextResponse.json(
      { error: chargeResult.errorMessage || "Payment failed. Please try again." },
      { status: 402 }
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        id: orderId,
        fridayDate: window.friday,
        parentName: body.parentName!.trim(),
        parentEmail: body.parentEmail!.trim(),
        parentPhone: body.parentPhone?.trim() || null,
        totalAmountCents,
        paymentStatus: chargeResult.paymentStatus,
        paymentMode: chargeResult.paymentMode,
        squarePaymentId: chargeResult.squarePaymentId,
        cheeseSlicePriceCents: prices.cheeseSlice,
        pepperoniSlicePriceCents: prices.pepperoniSlice,
        wholeCheesePriceCents: prices.wholeCheese,
        wholePepperoniPriceCents: prices.wholePepperoni,
        breadstickPriceCents: prices.breadsticks,
        snackPriceCents: prices.snack,
        drinkPriceCents: prices.drink,
        students: {
          create: body.students!.map((s, i) => ({
            cheeseSlicesFromWhole: people[i].cheeseSlicesFromWhole,
            pepperoniSlicesFromWhole: people[i].pepperoniSlicesFromWhole,
            firstName: s.firstName.trim(),
            lastName: s.lastName.trim(),
            grade: s.grade,
            cheeseSlices: s.cheeseSlices,
            pepperoniSlices: s.pepperoniSlices,
            wholeCheese: s.wholeCheese,
            wholePepperoni: s.wholePepperoni,
            breadsticks: s.breadsticks,
            snacks: s.snacks,
            drinks: s.drinks,
          })),
        },
      },
      include: { students: true },
    });
  });

  await sendOrderConfirmationEmail({
    orderId: order.id,
    parentName: order.parentName,
    parentEmail: order.parentEmail,
    fridayDateLabel: window.friday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    totalAmountCents: order.totalAmountCents,
    labels,
    students: order.students.map((s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      sharedLines: sharedSliceLines(s, { cheese: labels.wholeCheese, pepperoni: labels.wholePepperoni }),
      quantities: Object.fromEntries(
        ITEM_KEYS.map((key) => {
          const map: Record<string, number> = {
            cheeseSlice: s.cheeseSlices,
            pepperoniSlice: s.pepperoniSlices,
            wholeCheese: s.wholeCheese,
            wholePepperoni: s.wholePepperoni,
            breadsticks: s.breadsticks,
            snack: s.snacks,
            drink: s.drinks,
          };
          return [key, map[key]];
        })
      ),
    })),
  });

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
