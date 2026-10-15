import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUpcomingFriday } from "@/lib/friday";
import { getCurrentPriceSettings, computeOrderTotalCents, type StudentQuantities } from "@/lib/pricing";
import { chargeOrder } from "@/lib/square";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { ITEM_KEYS, GRADE_VALUES, isSecondaryGrade, SLICES_PER_PIZZA, SCHOOL_TIMEZONE } from "@/lib/constants";
import { validateWholeAllocation, sharedSliceLines } from "@/lib/wholePizza";
import { getPrepayFridays } from "@/lib/prepay";

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
  // Prepay: repeat this exact order every remaining pizza Friday, paid once.
  repeatThroughYear?: boolean;
  expectedWeeks?: number;
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

  let fridays = [window.friday];
  if (body.repeatThroughYear === true) {
    const prepayFridays = getPrepayFridays(window.friday, skippedDates);
    if (!prepayFridays) return badRequest("Paying for the rest of the year isn't available right now.");
    if (body.expectedWeeks !== prepayFridays.length) {
      return badRequest(
        "The number of remaining pizza Fridays changed while you were ordering. Please refresh the page and check your total before paying."
      );
    }
    fridays = prepayFridays;
  }
  const isPrepaid = body.repeatThroughYear === true;

  const { price: prices, label: labels } = await getCurrentPriceSettings();
  const weeklyTotalCents = computeOrderTotalCents(body.students, prices);
  const totalAmountCents = weeklyTotalCents * fridays.length;
  const groupId = randomUUID();

  const chargeResult = await chargeOrder({
    idempotencyKey: groupId,
    amountCents: totalAmountCents,
    sourceId: body.sourceId,
  });

  if (chargeResult.paymentStatus === "failed") {
    return NextResponse.json(
      { error: chargeResult.errorMessage || "Payment failed. Please try again." },
      { status: 402 }
    );
  }

  // One order per covered Friday (a single one for a normal order), written in
  // one transaction so a prepay is never half-recorded after the card is charged.
  const created = await prisma.$transaction(
    fridays.map((friday, i) =>
      prisma.order.create({
        data: {
          id: i === 0 && !isPrepaid ? groupId : randomUUID(),
          fridayDate: friday,
          parentName: body.parentName!.trim(),
          parentEmail: body.parentEmail!.trim(),
          parentPhone: body.parentPhone?.trim() || null,
          totalAmountCents: weeklyTotalCents,
          paymentStatus: chargeResult.paymentStatus,
          paymentMode: chargeResult.paymentMode,
          squarePaymentId: chargeResult.squarePaymentId,
          prepaidGroupId: isPrepaid ? groupId : null,
          prepaidWeek: isPrepaid ? i + 1 : null,
          prepaidWeeks: isPrepaid ? fridays.length : null,
          cheeseSlicePriceCents: prices.cheeseSlice,
          pepperoniSlicePriceCents: prices.pepperoniSlice,
          wholeCheesePriceCents: prices.wholeCheese,
          wholePepperoniPriceCents: prices.wholePepperoni,
          breadstickPriceCents: prices.breadsticks,
          snackPriceCents: prices.snack,
          drinkPriceCents: prices.drink,
          students: {
            create: body.students!.map((s, j) => ({
              cheeseSlicesFromWhole: people[j].cheeseSlicesFromWhole,
              pepperoniSlicesFromWhole: people[j].pepperoniSlicesFromWhole,
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
      })
    )
  );
  const order = created[0];

  await sendOrderConfirmationEmail({
    orderId: order.id,
    parentName: order.parentName,
    parentEmail: order.parentEmail,
    fridayDateLabel: window.friday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    totalAmountCents,
    prepaid: isPrepaid
      ? {
          weeklyTotalCents,
          fridayLabels: fridays.map((f) =>
            f.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: SCHOOL_TIMEZONE })
          ),
        }
      : undefined,
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
