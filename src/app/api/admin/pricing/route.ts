import { NextResponse } from "next/server";
import { getCurrentPriceSettings } from "@/lib/pricing";
import { ITEM_KEYS } from "@/lib/constants";

export async function GET() {
  const settings = await getCurrentPriceSettings();
  const items = ITEM_KEYS.map((itemKey) => ({
    itemKey,
    label: settings.label[itemKey],
    unitPriceCents: settings.price[itemKey],
  }));
  return NextResponse.json({ items });
}
