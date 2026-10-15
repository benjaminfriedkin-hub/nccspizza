import { describe, expect, it } from "vitest";
import { getPrepayFridays } from "./prepay";

const d = (iso: string) => new Date(iso);

describe("getPrepayFridays", () => {
  it("is not offered before the launch Friday", () => {
    expect(getPrepayFridays(d("2026-10-30T04:00:00.000Z"), [])).toBeNull();
  });
  it("covers Nov 6 through the last Friday before school ends (30 Fridays with nothing skipped)", () => {
    const list = getPrepayFridays(d("2026-11-06T05:00:00.000Z"), [])!;
    expect(list).toHaveLength(30);
    expect(list[0].toISOString().slice(0, 10)).toBe("2026-11-06");
    expect(list[list.length - 1].toISOString().slice(0, 10)).toBe("2027-05-28");
  });
  it("gives 23 weeks with the 7 confirmed red Fridays skipped", () => {
    const skipped = ["2026-11-27", "2026-12-25", "2027-01-01", "2027-01-22", "2027-02-12", "2027-03-26", "2027-04-02"].map((s) =>
      d(s + "T12:00:00.000Z")
    );
    expect(getPrepayFridays(d("2026-11-06T05:00:00.000Z"), skipped)).toHaveLength(23);
  });
  it("covers fewer weeks the later someone buys", () => {
    expect(getPrepayFridays(d("2027-05-14T04:00:00.000Z"), [])).toHaveLength(3);
  });
  it("is not offered when only one week remains", () => {
    expect(getPrepayFridays(d("2027-05-28T04:00:00.000Z"), [])).toBeNull();
  });
});
