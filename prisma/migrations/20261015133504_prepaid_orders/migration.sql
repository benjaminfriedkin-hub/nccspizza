-- Link the weekly orders created by a single "prepay the rest of the year" purchase.
ALTER TABLE "Order" ADD COLUMN "prepaidGroupId" TEXT;
ALTER TABLE "Order" ADD COLUMN "prepaidWeek" INTEGER;
ALTER TABLE "Order" ADD COLUMN "prepaidWeeks" INTEGER;
CREATE INDEX "Order_prepaidGroupId_idx" ON "Order"("prepaidGroupId");
