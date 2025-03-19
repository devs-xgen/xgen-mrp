/*
  Warnings:

  - You are about to drop the column `calculatedStock` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `committedStock` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `expectedStock` on the `Material` table. All the data in the column will be lost.
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

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "calculatedStock",
DROP COLUMN "committedStock",
DROP COLUMN "expectedStock";
