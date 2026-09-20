import { describe, expect, it } from "vitest";
import { computePizzaNeeds, type StudentOrderQuantities } from "./pizzaMath";

function student(overrides: Partial<StudentOrderQuantities>): StudentOrderQuantities {
  return {
    cheeseSlices: 0,
    pepperoniSlices: 0,
    wholeCheese: 0,
    wholePepperoni: 0,
    breadsticks: 0,
    snacks: 0,
    drinks: 0,
    ...overrides,
  };
}

describe("computePizzaNeeds", () => {
  it("matches the brief's worked example: 40 cheese slices + 3 whole cheese pizzas = 8 whole pizzas", () => {
    const students = [student({ cheeseSlices: 40 }), student({ wholeCheese: 3 })];
    const needs = computePizzaNeeds(students);
    expect(needs.cheese.pizzasFromSlices).toBe(5);
    expect(needs.cheese.wholeOrdered).toBe(3);
    expect(needs.cheese.totalPizzasNeeded).toBe(8);
  });

  it("rounds up slice counts that don't divide evenly by 8", () => {
    const students = [student({ pepperoniSlices: 9 })];
    const needs = computePizzaNeeds(students);
    expect(needs.pepperoni.pizzasFromSlices).toBe(2);
    expect(needs.pepperoni.totalPizzasNeeded).toBe(2);
  });

  it("sums breadstick orders across students", () => {
    const students = [student({ breadsticks: 1 }), student({ breadsticks: 2 })];
    const needs = computePizzaNeeds(students);
    expect(needs.breadsticks.totalStudentOrders).toBe(3);
  });

  it("converts breadstick orders to Cottage Inn purchase orders (4 parent orders = 1 tray), rounding up", () => {
    const students = [student({ breadsticks: 5 })];
    const needs = computePizzaNeeds(students);
    expect(needs.breadsticks.purchaseOrdersFromStudentOrders).toBe(2);
    expect(needs.breadsticks.totalPurchaseOrdersNeeded).toBe(2);
  });

  it("sums snack and drink orders across students", () => {
    const students = [student({ snacks: 1, drinks: 2 }), student({ snacks: 3, drinks: 1 })];
    const needs = computePizzaNeeds(students);
    expect(needs.snackOrders).toBe(4);
    expect(needs.drinkOrders).toBe(3);
  });

  it("returns zeros for an empty order list", () => {
    const needs = computePizzaNeeds([]);
    expect(needs.cheese.totalPizzasNeeded).toBe(0);
    expect(needs.pepperoni.totalPizzasNeeded).toBe(0);
    expect(needs.breadsticks.totalPurchaseOrdersNeeded).toBe(0);
    expect(needs.snackOrders).toBe(0);
    expect(needs.drinkOrders).toBe(0);
  });
});
