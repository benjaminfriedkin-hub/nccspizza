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
  buffer: number;
  totalPizzasNeeded: number;
}

export interface PizzaNeeds {
  cheese: PizzaTypeNeeds;
  pepperoni: PizzaTypeNeeds;
  breadstickOrdersFromStudents: number;
  breadstickBuffer: number;
  breadstickOrders: number;
  snackOrders: number;
  drinkOrders: number;
}

export interface WeeklyBuffer {
  cheesePizzas: number;
  pepperoniPizzas: number;
  breadsticks: number;
}

const NO_BUFFER: WeeklyBuffer = { cheesePizzas: 0, pepperoniPizzas: 0, breadsticks: 0 };

function sum(students: StudentOrderQuantities[], key: keyof StudentOrderQuantities): number {
  return students.reduce((total, s) => total + s[key], 0);
}

function typeNeeds(totalSlices: number, wholeOrdered: number, buffer: number): PizzaTypeNeeds {
  const pizzasFromSlices = Math.ceil(totalSlices / SLICES_PER_PIZZA);
  return {
    totalSlices,
    pizzasFromSlices,
    wholeOrdered,
    buffer,
    totalPizzasNeeded: pizzasFromSlices + wholeOrdered + buffer,
  };
}

export function computePizzaNeeds(
  students: StudentOrderQuantities[],
  buffer: WeeklyBuffer = NO_BUFFER
): PizzaNeeds {
  const breadstickOrdersFromStudents = sum(students, "breadsticks");
  return {
    cheese: typeNeeds(sum(students, "cheeseSlices"), sum(students, "wholeCheese"), buffer.cheesePizzas),
    pepperoni: typeNeeds(sum(students, "pepperoniSlices"), sum(students, "wholePepperoni"), buffer.pepperoniPizzas),
    breadstickOrdersFromStudents,
    breadstickBuffer: buffer.breadsticks,
    breadstickOrders: breadstickOrdersFromStudents + buffer.breadsticks,
    snackOrders: sum(students, "snacks"),
    drinkOrders: sum(students, "drinks"),
  };
}
