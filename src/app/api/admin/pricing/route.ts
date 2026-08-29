import { NextResponse } from "next/server";
import { getCurrentPrices } from "@/lib/pricing";
import { ITEM_LABELS } from "@/lib/constants";

export async function GET() {
  const prices = await getCurrentPrices();
  const items = Object.entries(prices).map(([itemKey, unitPriceCents]) => ({
    itemKey,
    label: ITEM_LABELS[itemKey as keyof typeof ITEM_LABELS],
    unitPriceCents,
  }));
  return NextResponse.json({ items });
}
