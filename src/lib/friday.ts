import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { SCHOOL_TIMEZONE } from "./constants";

export interface FridayWindow {
  friday: Date;
  cutoff: Date;
  orderingOpen: boolean;
  isSkipped: boolean;
}

const FRIDAY_WEEKDAY = 5; // Date#getDay(): Sunday=0 ... Friday=5

interface ZonedParts {
  year: number;
  month: number; // 0-indexed
  day: number;
  weekday: number;
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
}

/**
 * Reads the wall-clock date/time that `date` represents in `timeZone`.
 *
 * date-fns-tz's `toZonedTime` returns a Date whose value, read via the
 * host's *local* getters, gives the target timezone's wall clock (it does
 * not touch the UTC fields at all). Reading it with local getters here —
 * and building instants below with the local `Date` constructor — keeps
 * the two operations self-consistent regardless of the host machine's own
 * timezone, since both sides use the same (local) interpretation.
 */
function zonedParts(date: Date, timeZone: string): ZonedParts {
  const zoned = toZonedTime(date, timeZone);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth(),
    day: zoned.getDate(),
    weekday: zoned.getDay(),
    hours: zoned.getHours(),
    minutes: zoned.getMinutes(),
    seconds: zoned.getSeconds(),
    ms: zoned.getMilliseconds(),
  };
}

/** Builds the true UTC instant for a specific wall-clock date/time in `timeZone`. */
function zonedInstant(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  const wallClockLocal = new Date(year, month, day, hours, minutes, seconds, ms);
  return fromZonedTime(wallClockLocal, timeZone);
}

function addLocalDays(date: Date, days: number, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  return zonedInstant(timeZone, p.year, p.month, p.day + days, p.hours, p.minutes, p.seconds, p.ms);
}

function isSameLocalDay(a: Date, b: Date, timeZone: string): boolean {
  const pa = zonedParts(a, timeZone);
  const pb = zonedParts(b, timeZone);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/**
 * The nearest calendar Friday on or after `date` (local midnight of that
 * Friday, in `timeZone`, returned as a UTC instant). If `date` itself falls
 * on a Friday, returns that same Friday.
 */
export function getFridayOfWeek(date: Date, timeZone: string = SCHOOL_TIMEZONE): Date {
  const parts = zonedParts(date, timeZone);
  const daysUntilFriday = (FRIDAY_WEEKDAY - parts.weekday + 7) % 7;
  return zonedInstant(timeZone, parts.year, parts.month, parts.day + daysUntilFriday);
}

/** 11:59:59.999 PM the Wednesday before `friday`, as a UTC instant. */
export function getCutoffFor(friday: Date, timeZone: string = SCHOOL_TIMEZONE): Date {
  const p = zonedParts(friday, timeZone);
  return zonedInstant(timeZone, p.year, p.month, p.day - 2, 23, 59, 59, 999);
}

/**
 * 12:00:00 AM the Saturday right after `friday` — the instant ordering
 * reopens for the following week (a new window is open from here until
 * that following Friday's own Wednesday cutoff).
 */
export function getReopensAt(friday: Date, timeZone: string = SCHOOL_TIMEZONE): Date {
  const p = zonedParts(friday, timeZone);
  return zonedInstant(timeZone, p.year, p.month, p.day + 1);
}

/**
 * Window info for the nearest calendar Friday on/after `now`, evaluated for
 * that specific date — does not silently roll forward to a later Friday
 * even if that date is skipped or already past its own cutoff.
 */
export function getUpcomingFriday(
  now: Date,
  skippedFridayDates: Date[] = [],
  timeZone: string = SCHOOL_TIMEZONE
): FridayWindow {
  const friday = getFridayOfWeek(now, timeZone);
  const cutoff = getCutoffFor(friday, timeZone);
  const isSkipped = skippedFridayDates.some((d) => isSameLocalDay(d, friday, timeZone));
  const orderingOpen = !isSkipped && now.getTime() <= cutoff.getTime();
  return { friday, cutoff, orderingOpen, isSkipped };
}

/**
 * Scans forward week by week (bounded by maxWeeksLookahead) for the first
 * Friday that is both unskipped and still within its ordering window.
 * Returns null if none is found within the lookahead window.
 */
export function getNextOrderableFriday(
  now: Date,
  skippedFridayDates: Date[] = [],
  maxWeeksLookahead = 8,
  timeZone: string = SCHOOL_TIMEZONE
): FridayWindow | null {
  let candidate = getFridayOfWeek(now, timeZone);
  for (let i = 0; i < maxWeeksLookahead; i++) {
    const cutoff = getCutoffFor(candidate, timeZone);
    const isSkipped = skippedFridayDates.some((d) => isSameLocalDay(d, candidate, timeZone));
    const orderingOpen = !isSkipped && now.getTime() <= cutoff.getTime();
    if (orderingOpen) {
      return { friday: candidate, cutoff, orderingOpen: true, isSkipped: false };
    }
    candidate = addLocalDays(candidate, 7, timeZone);
  }
  return null;
}

/** Fridays for the admin Friday picker: `weeksBack` before through `weeksForward` after the upcoming one. */
export function listFridaysAround(
  now: Date,
  weeksBack: number,
  weeksForward: number,
  timeZone: string = SCHOOL_TIMEZONE
): Date[] {
  const nearest = getFridayOfWeek(now, timeZone);
  const list: Date[] = [];
  for (let i = -weeksBack; i <= weeksForward; i++) {
    list.push(addLocalDays(nearest, i * 7, timeZone));
  }
  return list;
}
