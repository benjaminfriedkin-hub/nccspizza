-- Let a whole pizza be split among several people on an order.
ALTER TABLE "OrderStudent" ADD COLUMN "cheeseSlicesFromWhole" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderStudent" ADD COLUMN "pepperoniSlicesFromWhole" INTEGER NOT NULL DEFAULT 0;

-- Existing orders: the buyer keeps every slice of the whole pizzas they bought.
UPDATE "OrderStudent" SET
  "cheeseSlicesFromWhole" = "wholeCheese" * 8,
  "pepperoniSlicesFromWhole" = "wholePepperoni" * 8;
