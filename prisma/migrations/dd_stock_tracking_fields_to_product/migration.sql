-- Create Inspector Table
CREATE TABLE "Inspector" (
  "inspectorId" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phoneNumber" TEXT,
  "department" TEXT,
  "specialization" TEXT,
  "certificationLevel" TEXT,
  "yearsOfExperience" INTEGER,
  "isActive" BOOLEAN DEFAULT TRUE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "modifiedBy" TEXT
);

-- Create index on email for faster lookups
CREATE INDEX "Inspector_email_idx" ON "Inspector"("email");

-- Create index on isActive for filtering active inspectors
CREATE INDEX "Inspector_isActive_idx" ON "Inspector"("isActive");


-- -- AlterTable
-- ALTER TABLE "Product" ADD COLUMN "expectedStock" INTEGER NOT NULL DEFAULT 0,
--                       ADD COLUMN "committedStock" INTEGER NOT NULL DEFAULT 0,
--                       ADD COLUMN "calculatedStock" INTEGER NOT NULL DEFAULT 0;

-- -- UpdateData (Initialize calculatedStock with currentStock values)
-- UPDATE "Product" SET "calculatedStock" = "currentStock";