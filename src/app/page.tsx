import { prisma } from "@/lib/prisma";
import { getUpcomingFriday, getNextOrderableFriday } from "@/lib/friday";
import { getCurrentPrices } from "@/lib/pricing";
import { OrderForm } from "@/components/order/OrderForm";
import { Card } from "@/components/ui/Card";

// This page's content depends on the current time (ordering cutoff),
// admin-edited prices, and the skipped-Friday schedule — it must be
// computed fresh on every request, never frozen at build time.
export const dynamic = "force-dynamic";

function formatFriday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default async function Home() {
  const skippedRows = await prisma.skippedFriday.findMany();
  const skippedDates = skippedRows.map((r) => r.date);
  const window = getUpcomingFriday(new Date(), skippedDates);

  return (
    <div className="flex flex-1 justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-stone-900">🍕 NCCS Pizza Fridays</h1>
          <p className="mt-1 text-sm text-stone-600">New Covenant Christian School fundraiser lunch</p>
        </header>

        {window.orderingOpen ? (
          <>
            <Card className="mb-6 p-4 text-center">
              <p className="text-sm text-stone-700">
                Ordering for <span className="font-semibold">{formatFriday(window.friday)}</span>
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Ordering closes Wednesday 11:59 PM
              </p>
            </Card>
            <OrderForm prices={await getCurrentPrices()} fridayLabel={formatFriday(window.friday)} />
          </>
        ) : (
          <ClosedState friday={window.friday} isSkipped={window.isSkipped} skippedDates={skippedDates} />
        )}
      </main>
    </div>
  );
}

async function ClosedState({
  friday,
  isSkipped,
  skippedDates,
}: {
  friday: Date;
  isSkipped: boolean;
  skippedDates: Date[];
}) {
  const next = getNextOrderableFriday(new Date(), skippedDates);

  return (
    <Card className="p-6 text-center">
      <p className="text-lg font-semibold text-stone-800">
        {isSkipped ? `No pizza lunch this Friday (${formatFriday(friday)})` : "Ordering is closed for this week"}
      </p>
      <p className="mt-2 text-sm text-stone-600">
        {isSkipped
          ? "Enjoy the break! Check back for the next order window."
          : "The Wednesday 11:59 PM cutoff has passed for this Friday."}
      </p>
      {next && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Next order window opens for <span className="font-semibold">{formatFriday(next.friday)}</span>
        </p>
      )}
    </Card>
  );
}
