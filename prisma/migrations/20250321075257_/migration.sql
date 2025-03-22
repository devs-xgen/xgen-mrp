/*
  Warnings:

  - Made the column `isActive` on table `Inspector` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Inspector` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Inspector` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Inspector" ALTER COLUMN "isActive" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Inspector_email_idx" ON "Inspector"("email");

-- CreateIndex
CREATE INDEX "Inspector_isActive_idx" ON "Inspector"("isActive");
