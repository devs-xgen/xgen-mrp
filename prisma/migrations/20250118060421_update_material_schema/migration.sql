/*
  Warnings:

  - You are about to drop the column `color` on the `Material` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Material` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE', 'OTHER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'POS_OPERATOR';

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "color",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sku" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "handledBy" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_sku_key" ON "Material"("sku");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_handledBy_fkey" FOREIGN KEY ("handledBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
