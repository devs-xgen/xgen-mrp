/*
  Warnings:

  - The values [OPERATOR,POS_OPERATOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserPortal" AS ENUM ('ADMIN_PORTAL', 'WORKER_PORTAL', 'INSPECTOR_PORTAL', 'DELIVERY_PORTAL');

-- Map existing roles to new roles
-- First create a temporary column to track which roles need updating
ALTER TABLE "User" ADD COLUMN "temp_old_role" TEXT;
UPDATE "User" SET "temp_old_role" = "role"::TEXT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'MANAGER', 'PRODUCTION_WORKER', 'MACHINE_OPERATOR', 'TEAM_LEADER', 'QUALITY_INSPECTOR', 'QUALITY_MANAGER', 'WAREHOUSE_OPERATOR', 'LOGISTICS_MANAGER', 'DELIVERY_PERSONNEL');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Convert old roles to new roles
UPDATE "User" SET "role" = 'ADMIN'::"Role_new" WHERE "role"::TEXT = 'ADMIN';
UPDATE "User" SET "role" = 'MANAGER'::"Role_new" WHERE "role"::TEXT = 'MANAGER';
UPDATE "User" SET "role" = 'PRODUCTION_WORKER'::"Role_new" WHERE "role"::TEXT = 'OPERATOR';
UPDATE "User" SET "role" = 'MACHINE_OPERATOR'::"Role_new" WHERE "role"::TEXT = 'POS_OPERATOR';

ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PRODUCTION_WORKER';
COMMIT;

-- AlterTable
ALTER TABLE "Operation" ADD COLUMN "performedBy" TEXT;

-- AlterTable - add portal column to User
ALTER TABLE "User" ADD COLUMN "portal" "UserPortal" NOT NULL DEFAULT 'ADMIN_PORTAL';

-- Set portal based on roles
UPDATE "User" SET "portal" = 'ADMIN_PORTAL' WHERE "temp_old_role" IN ('ADMIN', 'MANAGER');
UPDATE "User" SET "portal" = 'WORKER_PORTAL' WHERE "temp_old_role" IN ('OPERATOR', 'POS_OPERATOR');

-- Remove temporary column
ALTER TABLE "User" DROP COLUMN "temp_old_role";

-- CreateTable
CREATE TABLE "WorkCenterAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "WorkCenterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenterAssignment_userId_workCenterId_key" ON "WorkCenterAssignment"("userId", "workCenterId");

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenterAssignment" ADD CONSTRAINT "WorkCenterAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenterAssignment" ADD CONSTRAINT "WorkCenterAssignment_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
