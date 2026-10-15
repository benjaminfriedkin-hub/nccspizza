import { LAST_DAY_OF_SCHOOL, PREPAY_FIRST_FRIDAY } from "./constants";
import { endOfLocalDay, listPizzaFridaysThrough, localYmd } from "./friday";

/**
 * The pizza Fridays a "prepay the rest of the year" purchase would cover,
 * starting at the Friday currently open for ordering, or null when the option
 * isn't offered (before the launch Friday, or fewer than 2 weeks remain).
 */
export function getPrepayFridays(openFriday: Date, skippedDates: Date[]): Date[] | null {
  if (localYmd(openFriday) < PREPAY_FIRST_FRIDAY) return null;
  const fridays = listPizzaFridaysThrough(openFriday, endOfLocalDay(LAST_DAY_OF_SCHOOL), skippedDates);
  return fridays.length >= 2 ? fridays : null;
}
