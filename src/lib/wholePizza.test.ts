import { describe, expect, it } from "vitest";
import { resolveSlices, shareNotes, validateWholeAllocation, type WholeShareFields } from "./wholePizza";

function p(o: Partial<WholeShareFields>): WholeShareFields {
  return { wholeCheese: 0, wholePepperoni: 0, cheeseSlicesFromWhole: 0, pepperoniSlicesFromWhole: 0, ...o };
}

describe("resolveSlices", () => {
  const people = [
    { key: "a", whole: 1 },
    { key: "b", whole: 0 },
  ];
  it("defaults to the buyer keeping all 8 slices", () => {
    expect(resolveSlices(people, null)).toEqual({ a: 8, b: 0 });
  });
  it("uses a custom split while the pizza count still matches", () => {
    expect(resolveSlices(people, { forTotal: 1, slices: { a: 5, b: 3 } })).toEqual({ a: 5, b: 3 });
  });
  it("ignores a stale split after the pizza count changes", () => {
    expect(resolveSlices([{ key: "a", whole: 2 }, { key: "b", whole: 0 }], { forTotal: 1, slices: { a: 5, b: 3 } })).toEqual({ a: 16, b: 0 });
  });
});

describe("validateWholeAllocation", () => {
  it("accepts a split that adds up to 8 per pizza", () => {
    expect(validateWholeAllocation([p({ wholePepperoni: 1, pepperoniSlicesFromWhole: 4 }), p({ pepperoniSlicesFromWhole: 3 }), p({ pepperoniSlicesFromWhole: 1 })])).toBeNull();
  });
  it("rejects a split that doesn't add up", () => {
    expect(validateWholeAllocation([p({ wholePepperoni: 1, pepperoniSlicesFromWhole: 4 }), p({ pepperoniSlicesFromWhole: 3 })])).toMatch(/7 of 8/);
  });
  it("rejects slices with no whole pizza bought", () => {
    expect(validateWholeAllocation([p({ cheeseSlicesFromWhole: 2 })])).toMatch(/2 of 0/);
  });
  it("accepts orders with no whole pizzas", () => {
    expect(validateWholeAllocation([p({})])).toBeNull();
  });
});

describe("shareNotes", () => {
  it("is empty when nothing is shared", () => {
    expect(shareNotes([{ ...p({ wholeCheese: 1, cheeseSlicesFromWhole: 8 }), name: "Ava" }])).toEqual([""]);
  });
  it("lists the split on every participant's row", () => {
    const notes = shareNotes([
      { ...p({ wholePepperoni: 1, pepperoniSlicesFromWhole: 4 }), name: "Ava A" },
      { ...p({ pepperoniSlicesFromWhole: 4 }), name: "Ben A" },
      { ...p({}), name: "Cy A" },
    ]);
    expect(notes[0]).toBe("Whole pepperoni pizza split: Ava A 4 slices, Ben A 4 slices");
    expect(notes[1]).toBe(notes[0]);
    expect(notes[2]).toBe("");
  });
});
