-- CreateTable
CREATE TABLE "PriceSetting" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkippedFriday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkippedFriday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "fridayDate" TIMESTAMP(3) NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "totalAmountCents" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "squarePaymentId" TEXT,
    "cheeseSlicePriceCents" INTEGER NOT NULL,
    "pepperoniSlicePriceCents" INTEGER NOT NULL,
    "wholeCheesePriceCents" INTEGER NOT NULL,
    "wholePepperoniPriceCents" INTEGER NOT NULL,
    "breadstickPriceCents" INTEGER NOT NULL,
    "snackPriceCents" INTEGER NOT NULL DEFAULT 75,
    "drinkPriceCents" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStudent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "cheeseSlices" INTEGER NOT NULL DEFAULT 0,
    "pepperoniSlices" INTEGER NOT NULL DEFAULT 0,
    "wholeCheese" INTEGER NOT NULL DEFAULT 0,
    "wholePepperoni" INTEGER NOT NULL DEFAULT 0,
    "breadsticks" INTEGER NOT NULL DEFAULT 0,
    "snacks" INTEGER NOT NULL DEFAULT 0,
    "drinks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceSetting_itemKey_key" ON "PriceSetting"("itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "SkippedFriday_date_key" ON "SkippedFriday"("date");

-- CreateIndex
CREATE INDEX "Order_fridayDate_idx" ON "Order"("fridayDate");

-- CreateIndex
CREATE INDEX "OrderStudent_orderId_idx" ON "OrderStudent"("orderId");

-- AddForeignKey
ALTER TABLE "OrderStudent" ADD CONSTRAINT "OrderStudent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
