import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { gradeLabel } from "@/lib/constants";
import { getCurrentPriceSettings } from "@/lib/pricing";
import { sharedSliceLines } from "@/lib/wholePizza";
import { Card } from "@/components/ui/Card";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const LINE_ITEMS = [
  ["cheeseSlices", "cheeseSlice"],
  ["pepperoniSlices", "pepperoniSlice"],
  ["wholeCheese", "wholeCheese"],
  ["wholePepperoni", "wholePepperoni"],
  ["breadsticks", "breadsticks"],
  ["snacks", "snack"],
  ["drinks", "drink"],
] as const;

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { students: true },
  });

  if (!order) notFound();

  const { label: labels } = await getCurrentPriceSettings();

  const fridayLabel = order.fridayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-1 justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <p className="text-4xl">✅</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Order confirmed!</h1>
          <p className="mt-1 text-sm text-stone-600">
            A confirmation email is on its way to {order.parentEmail}.
          </p>
        </div>

        <Card className="p-5">
          <p className="text-sm text-stone-600">Pizza for {fridayLabel}</p>
          <p className="mt-1 text-xs text-stone-400">Order #{order.id}</p>

          <div className="mt-4 space-y-4 border-t border-stone-100 pt-4">
            {order.students.map((s) => (
              <div key={s.id}>
                <p className="text-sm font-medium text-stone-800">
                  {s.firstName} {s.lastName} — {gradeLabel(s.grade)}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                  {LINE_ITEMS.map(([qtyKey, label]) => {
                    const qty = s[qtyKey];
                    if (!qty) return null;
                    return (
                      <li key={qtyKey}>
                        {qty} × {labels[label]}
                      </li>
                    );
                  })}
                  {sharedSliceLines(s, { cheese: labels.wholeCheese, pepperoni: labels.wholePepperoni }).map((line) => (
                    <li key={line}>🍕 {line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3">
            <span className="text-sm font-semibold text-stone-800">Total charged</span>
            <span className="text-lg font-bold text-amber-700">{formatCents(order.totalAmountCents)}</span>
          </div>
        </Card>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-amber-700 hover:underline">
            ← Back to ordering
          </Link>
        </p>
      </main>
    </div>
  );
}
