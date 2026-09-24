import {
  SLICES_PER_PIZZA,
  BREADSTICK_PIECES_PER_PARENT_ORDER,
  BREADSTICK_PIECES_PER_PURCHASE_ORDER,
} from "./constants";

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

export interface BreadstickNeeds {
  totalStudentOrders: number;
  totalPieces: number;
  purchaseOrdersFromStudentOrders: number;
  buffer: number;
  totalPurchaseOrdersNeeded: number;
}

export interface PizzaNeeds {
  cheese: PizzaTypeNeeds;
  pepperoni: PizzaTypeNeeds;
  breadsticks: BreadstickNeeds;
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

function breadstickNeeds(totalStudentOrders: number, buffer: number): BreadstickNeeds {
  const totalPieces = totalStudentOrders * BREADSTICK_PIECES_PER_PARENT_ORDER;
  const purchaseOrdersFromStudentOrders = Math.ceil(totalPieces / BREADSTICK_PIECES_PER_PURCHASE_ORDER);
  return {
    totalStudentOrders,
    totalPieces,
    purchaseOrdersFromStudentOrders,
    buffer,
    totalPurchaseOrdersNeeded: purchaseOrdersFromStudentOrders + buffer,
  };
}

export function computePizzaNeeds(
  students: StudentOrderQuantities[],
  buffer: WeeklyBuffer = NO_BUFFER
): PizzaNeeds {
  return {
    cheese: typeNeeds(sum(students, "cheeseSlices"), sum(students, "wholeCheese"), buffer.cheesePizzas),
    pepperoni: typeNeeds(sum(students, "pepperoniSlices"), sum(students, "wholePepperoni"), buffer.pepperoniPizzas),
    breadsticks: breadstickNeeds(sum(students, "breadsticks"), buffer.breadsticks),
    snackOrders: sum(students, "snacks"),
    drinkOrders: sum(students, "drinks"),
  };
}
