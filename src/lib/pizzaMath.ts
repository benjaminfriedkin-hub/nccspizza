import { SLICES_PER_PIZZA } from "./constants";

export interface StudentOrderQuantities {
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  breadsticks: number;
  snacks: number;
  drinks: number;
}

export interface PizzaTypeNeeds {
  totalSlices: number;
  pizzasFromSlices: number;
  wholeOrdered: number;
  totalPizzasNeeded: number;
}

export interface PizzaNeeds {
  cheese: PizzaTypeNeeds;
  pepperoni: PizzaTypeNeeds;
  breadstickOrders: number;
  snackOrders: number;
  drinkOrders: number;
}

function sum(students: StudentOrderQuantities[], key: keyof StudentOrderQuantities): number {
  return students.reduce((total, s) => total + s[key], 0);
}

function typeNeeds(totalSlices: number, wholeOrdered: number): PizzaTypeNeeds {
  const pizzasFromSlices = Math.ceil(totalSlices / SLICES_PER_PIZZA);
  return {
    totalSlices,
    pizzasFromSlices,
    wholeOrdered,
    totalPizzasNeeded: pizzasFromSlices + wholeOrdered,
  };
}

export function computePizzaNeeds(students: StudentOrderQuantities[]): PizzaNeeds {
  return {
    cheese: typeNeeds(sum(students, "cheeseSlices"), sum(students, "wholeCheese")),
    pepperoni: typeNeeds(sum(students, "pepperoniSlices"), sum(students, "wholePepperoni")),
    breadstickOrders: sum(students, "breadsticks"),
    snackOrders: sum(students, "snacks"),
    drinkOrders: sum(students, "drinks"),
  };
}
