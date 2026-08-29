import { describe, expect, it } from "vitest";
import { getFridayOfWeek, getCutoffFor, getUpcomingFriday, getNextOrderableFriday, listFridaysAround } from "./friday";

const TZ = "America/New_York";

// A known week: Friday 2026-01-30 is the pizza day; ordering cutoff is
// Wednesday 2026-01-28 at 11:59:59.999 PM Eastern.
const FRIDAY = new Date("2026-01-30T05:00:00.000Z"); // local midnight EST

function easternInstant(iso: string): Date {
  // iso given as a naive local-time string; construct via Date.UTC then
  // shift by the known EST offset (-5) for these fixed winter dates.
  return new Date(iso + "-05:00");
}

describe("getFridayOfWeek", () => {
  it("returns the same Friday when given a Friday", () => {
    const result = getFridayOfWeek(FRIDAY, TZ);
    expect(result.getTime()).toBe(FRIDAY.getTime());
  });

  it("returns the upcoming Friday for a Monday earlier that week", () => {
    const monday = easternInstant("2026-01-26T09:00:00");
    const result = getFridayOfWeek(monday, TZ);
    expect(result.getTime()).toBe(FRIDAY.getTime());
  });

  it("rolls forward to next week's Friday once today's Friday has passed", () => {
    const saturday = easternInstant("2026-01-31T09:00:00");
    const result = getFridayOfWeek(saturday, TZ);
    const nextFriday = easternInstant("2026-02-06T00:00:00");
    expect(result.getTime()).toBe(nextFriday.getTime());
  });
});

describe("getCutoffFor", () => {
  it("is Wednesday 11:59:59.999pm before the given Friday", () => {
    const cutoff = getCutoffFor(FRIDAY, TZ);
    const expected = easternInstant("2026-01-28T23:59:59.999");
    expect(cutoff.getTime()).toBe(expected.getTime());
  });
});

describe("getUpcomingFriday", () => {
  it("is open early in the week (Monday)", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const window = getUpcomingFriday(now, [], TZ);
    expect(window.orderingOpen).toBe(true);
    expect(window.isSkipped).toBe(false);
    expect(window.friday.getTime()).toBe(FRIDAY.getTime());
  });

  it("is open right up to Wednesday 11:59:58pm", () => {
    const now = easternInstant("2026-01-28T23:59:58.000");
    const window = getUpcomingFriday(now, [], TZ);
    expect(window.orderingOpen).toBe(true);
  });

  it("is closed one second after cutoff (Thursday 12:00:00am)", () => {
    const now = easternInstant("2026-01-29T00:00:00.000");
    const window = getUpcomingFriday(now, [], TZ);
    expect(window.orderingOpen).toBe(false);
  });

  it("is closed on the Friday itself", () => {
    const now = easternInstant("2026-01-30T08:00:00");
    const window = getUpcomingFriday(now, [], TZ);
    expect(window.orderingOpen).toBe(false);
  });

  it("reports isSkipped when the upcoming Friday is marked skipped, even before cutoff", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const window = getUpcomingFriday(now, [FRIDAY], TZ);
    expect(window.isSkipped).toBe(true);
    expect(window.orderingOpen).toBe(false);
  });
});

describe("getNextOrderableFriday", () => {
  it("returns the upcoming Friday when it's open", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const result = getNextOrderableFriday(now, [], 8, TZ);
    expect(result?.friday.getTime()).toBe(FRIDAY.getTime());
  });

  it("skips a single skipped Friday and finds the next one", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const result = getNextOrderableFriday(now, [FRIDAY], 8, TZ);
    const nextFriday = easternInstant("2026-02-06T00:00:00");
    expect(result?.friday.getTime()).toBe(nextFriday.getTime());
  });

  it("skips a 3-week consecutive skip streak (e.g. a holiday break)", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const week2 = easternInstant("2026-02-06T00:00:00");
    const week3 = easternInstant("2026-02-13T00:00:00");
    const result = getNextOrderableFriday(now, [FRIDAY, week2, week3], 8, TZ);
    const week4 = easternInstant("2026-02-20T00:00:00");
    expect(result?.friday.getTime()).toBe(week4.getTime());
  });

  it("returns null if every Friday within the lookahead window is skipped", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const skipped: Date[] = [];
    let d = FRIDAY;
    for (let i = 0; i < 8; i++) {
      skipped.push(d);
      d = getFridayOfWeek(new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), TZ);
    }
    const result = getNextOrderableFriday(now, skipped, 8, TZ);
    expect(result).toBeNull();
  });
});

describe("listFridaysAround", () => {
  it("lists the correct number of Fridays, 7 days apart", () => {
    const now = easternInstant("2026-01-26T09:00:00");
    const list = listFridaysAround(now, 2, 3, TZ);
    expect(list).toHaveLength(6);
    for (let i = 1; i < list.length; i++) {
      const diffDays = (list[i].getTime() - list[i - 1].getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(7);
    }
    expect(list[2].getTime()).toBe(FRIDAY.getTime());
  });
});
